import { NextResponse } from "next/server";
import { verifyAuthenticatedUser } from "@/lib/supabase/auth-guard";
import { assignMentor } from "@/lib/mentor/assignment";

/**
 * Stage 2.2 — Mentor Matching Engine.
 *
 * POST -> { mentor: Mentor }
 * Explicitly re-runs the matching engine and records a new assignment
 * row (does not touch/delete prior assignments — see migration 0013).
 * Distinct from getOrAssignMentor's lazy first-assignment path used by
 * /api/chat, which never re-matches an already-assigned user on its own.
 */
export async function POST() {
  const auth = await verifyAuthenticatedUser();
  if (!auth.ok) return auth.response;

  try {
    const mentor = await assignMentor(auth.data.user.id);
    return NextResponse.json({ mentor });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message } }, { status: 502 });
  }
}
