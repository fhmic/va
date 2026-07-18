import type { Goal, MemoryItem, Mentor, Profile, UserPreferences } from "@/types/database";

export interface PromptContext {
  mentor: Mentor;
  profile: Pick<Profile, "display_name" | "primary_goal" | "experience_level">;
  preferences: Pick<UserPreferences, "coaching_intensity" | "mentor_style">;
  memories: Pick<MemoryItem, "type" | "content">[];
  goals: Pick<Goal, "title" | "status">[];
}

/**
 * Pure function — no I/O — so it's directly unit-testable
 * (tests/unit/groq-prompt-assembly.test.ts) without mocking Supabase or
 * Groq. Assembles the full system prompt sent as the first message in
 * every /api/chat call. Deliberately does NOT echo raw memory items
 * verbatim in a way the model is asked to "repeat" — see the Phase 1
 * blueprint's prompt-injection threat-model entry (Section 14.6).
 */
export function buildSystemPrompt(ctx: PromptContext): string {
  const sections: string[] = [ctx.mentor.persona_prompt];

  sections.push(
    `The user's name is ${ctx.profile.display_name ?? "not provided"}. ` +
      `Their stated primary goal is "${ctx.profile.primary_goal ?? "not specified"}" ` +
      `at a self-reported experience level of "${ctx.profile.experience_level ?? "not specified"}".`,
  );

  sections.push(
    `Adapt your coaching intensity to "${ctx.preferences.coaching_intensity}" and your ` +
      `overall style toward "${ctx.preferences.mentor_style}", while staying in character.`,
  );

  if (ctx.goals.length > 0) {
    const activeGoals = ctx.goals.filter((g) => g.status === "active").map((g) => g.title);
    if (activeGoals.length > 0) {
      sections.push(`The user's active goals are: ${activeGoals.join("; ")}.`);
    }
  }

  if (ctx.memories.length > 0) {
    const memoryLines = ctx.memories.map((m) => `- (${m.type}) ${m.content}`).join("\n");
    sections.push(
      `Relevant things you remember about this user from past conversations:\n${memoryLines}\n` +
        `Use this naturally, as a mentor who remembers their mentee would — do not read it back verbatim or announce that you "recall" it from a database.`,
    );
  }

  return sections.join("\n\n");
}
