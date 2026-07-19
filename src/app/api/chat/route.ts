import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuthenticatedUser } from "@/lib/supabase/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrAssignMentor } from "@/lib/mentor/assignment";
import { getRelevantMemories } from "@/lib/memory/retrieval";
import { extractMemoriesFromMessages } from "@/lib/memory/extraction";
import { consolidateMemoriesIfNeeded } from "@/lib/memory/consolidation";
import { pickRelevantFramework } from "@/lib/coaching/frameworks";
import { recordActivitySnapshot } from "@/lib/progress/activity";
import { buildSystemPrompt } from "@/lib/groq/prompts";
import { streamChatCompletion, type GroqMessage } from "@/lib/groq/client";

const bodySchema = z.object({
  sessionId: z.string().uuid().nullable(),
  message: z.string().trim().min(1).max(4000),
  inputMode: z.enum(["text", "voice"]).default("text"),
});

const SHORT_TERM_CONTEXT_MESSAGES = 20;
const MEMORY_EXTRACTION_TRIGGER_EVERY_N_MESSAGES = 6;

/**
 * Stage 2.3 — Groq Integration / Stage 2.1 — Mentor Domain Model.
 *
 * POST { sessionId: string | null, message: string, inputMode }
 * -> text/event-stream of the mentor's reply, terminated by the raw
 *    Groq SSE stream ending (this proxies Groq's stream directly rather
 *    than re-framing it — the client is expected to parse Groq's
 *    `data: {...}` SSE lines the same way it would talking to Groq
 *    directly, since this route is a transparent proxy plus persistence,
 *    not a protocol translator).
 *
 * A null sessionId creates a new conversation_session, assigning a
 * mentor via getOrAssignMentor() if the user doesn't have one yet.
 */
export async function POST(request: Request) {
  const auth = await verifyAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const { user } = auth.data;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 },
    );
  }
  const { sessionId, message, inputMode } = parsed.data;

  const chatModel = process.env.GROQ_MODEL_CHAT;
  const utilityModel = process.env.GROQ_MODEL_UTILITY;
  if (!chatModel || !utilityModel) {
    return NextResponse.json(
      { error: { code: "UPSTREAM_ERROR", message: "Groq model configuration is missing" } },
      { status: 502 },
    );
  }

  const admin = createAdminClient();

  try {
    const mentor = await getOrAssignMentor(user.id);

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: session, error: sessionError } = await admin
        .from("conversation_sessions")
        .insert({ user_id: user.id, mentor_id: mentor.id })
        .select("id")
        .single();
      if (sessionError || !session) {
        throw new Error(`failed to create session: ${sessionError?.message}`);
      }
      activeSessionId = session.id;
    }

    const [{ data: profile }, { data: preferences }, { data: goals }, { data: frameworks }, memories, { data: history }] =
      await Promise.all([
        admin
          .from("profiles")
          .select("display_name, primary_goal, experience_level")
          .eq("id", user.id)
          .single(),
        admin
          .from("user_preferences")
          .select("coaching_intensity, mentor_style")
          .eq("user_id", user.id)
          .single(),
        admin.from("goals").select("title, status").eq("user_id", user.id).eq("status", "active"),
        admin.from("coaching_frameworks").select("*").eq("is_active", true),
        getRelevantMemories(admin, user.id),
        admin
          .from("messages")
          .select("role, content")
          .eq("session_id", activeSessionId)
          .order("created_at", { ascending: false })
          .limit(SHORT_TERM_CONTEXT_MESSAGES),
      ]);

    if (!profile || !preferences) {
      throw new Error("failed to load profile/preferences for prompt assembly");
    }

    const { error: userMessageError } = await admin.from("messages").insert({
      session_id: activeSessionId,
      user_id: user.id,
      role: "user",
      content: message,
      input_mode: inputMode,
    });
    if (userMessageError) {
      throw new Error(`failed to persist user message: ${userMessageError.message}`);
    }

    const framework = pickRelevantFramework(frameworks ?? [], profile.primary_goal);

    const systemPrompt = buildSystemPrompt({
      mentor,
      profile,
      preferences,
      memories,
      goals: goals ?? [],
      framework,
    });

    const shortTermContext: GroqMessage[] = (history ?? [])
      .slice()
      .reverse()
      .map((m) => ({
        role: m.role === "mentor" ? "assistant" : m.role === "system" ? "system" : "user",
        content: m.content,
      }));

    const groqResponse = await streamChatCompletion({
      model: chatModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...shortTermContext,
        { role: "user", content: message },
      ],
    });

    // Tee the upstream stream: one branch goes to the client immediately,
    // the other is buffered server-side so the full reply can be
    // persisted once streaming completes.
    const [clientStream, persistStream] = groqResponse.body!.tee();

    void persistFullReply({
      admin,
      sessionId: activeSessionId,
      userId: user.id,
      utilityModel,
      stream: persistStream,
    });

    await admin
      .from("conversation_sessions")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeSessionId);

    return new Response(clientStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Session-Id": activeSessionId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message } }, { status: 502 });
  }
}

/**
 * Buffers the Groq SSE stream to reconstruct the full assistant reply,
 * persists it, then (every N messages) triggers memory extraction.
 * Runs after the response has already been returned to the client —
 * failures here are logged, never surfaced to the user, per
 * extractMemoriesFromMessages's documented contract.
 */
async function persistFullReply(params: {
  admin: ReturnType<typeof createAdminClient>;
  sessionId: string;
  userId: string;
  utilityModel: string;
  stream: ReadableStream<Uint8Array>;
}) {
  try {
    const text = await readGroqSseText(params.stream);
    if (!text) return;

    await params.admin.from("messages").insert({
      session_id: params.sessionId,
      user_id: params.userId,
      role: "mentor",
      content: text,
    });

    await recordActivitySnapshot(params.userId);

    const { count } = await params.admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", params.sessionId);

    if (count && count % MEMORY_EXTRACTION_TRIGGER_EVERY_N_MESSAGES === 0) {
      const { data: recent } = await params.admin
        .from("messages")
        .select("role, content")
        .eq("session_id", params.sessionId)
        .order("created_at", { ascending: false })
        .limit(MEMORY_EXTRACTION_TRIGGER_EVERY_N_MESSAGES);

      await extractMemoriesFromMessages({
        userId: params.userId,
        utilityModel: params.utilityModel,
        recentMessages: (recent ?? []).slice().reverse(),
      });

      await consolidateMemoriesIfNeeded({
        userId: params.userId,
        utilityModel: params.utilityModel,
      });
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("persistFullReply failed:", err);
  }
}

/** Parses Groq's `data: {...}` SSE chunks and concatenates the delta text. */
async function readGroqSseText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice("data:".length).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) full += delta;
      } catch {
        // Ignore malformed SSE chunks rather than failing the whole read.
      }
    }
  }

  return full;
}
