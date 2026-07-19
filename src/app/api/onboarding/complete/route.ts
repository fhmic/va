import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuthenticatedUser } from "@/lib/supabase/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getRequiredLegalDocuments,
  recordLegalAcceptances,
} from "@/lib/legal/acceptance";

const PROFESSIONS = [
  "Student",
  "Professional",
  "Manager",
  "Executive",
  "Founder",
  "Consultant",
  "Job Seeker",
] as const;

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

const PRIMARY_GOALS = [
  "Improve Confidence",
  "Executive Presence",
  "Ace Interviews",
  "Improve Presentations",
  "Improve Meetings",
  "Become More Persuasive",
  "Leadership Communication",
] as const;

const bodySchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  timezone: z.string().trim().min(1).max(64),
  profession: z.enum(PROFESSIONS).optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
  primaryGoal: z.enum(PRIMARY_GOALS).optional(),
  // IDs of every legal_documents row the client is asserting the user
  // agreed to. This is NOT trusted at face value — the server always
  // re-derives "what's actually required right now" (see
  // getRequiredLegalDocuments) and rejects if the client's set doesn't
  // cover it, rather than trusting the client's list as sufficient.
  acceptedDocumentIds: z.array(z.string().uuid()).default([]),
});

/**
 * Marks onboarding complete for the current session's user.
 *
 * CTO Review Foundation Hardening changes applied here:
 *   - Change #1 (Legal Acceptance System): writes one immutable
 *     legal_acceptances row per required document instead of only
 *     setting profiles.terms_accepted_at. The request is rejected if the
 *     client didn't accept every currently-required document — the
 *     server treats its own required-document list as authoritative,
 *     never the client's.
 *   - Change #2 (Profile Foundation Fields): persists profession,
 *     experience_level, primary_goal.
 *   - Change #6 (Admin Client Safety): auth is verified via the shared
 *     verifyAuthenticatedUser() guard before the admin (service-role)
 *     client is touched at all, rather than each route hand-rolling its
 *     own getUser() check.
 *
 * `onboarding_completed_at` remains intentionally NOT client-updatable
 * via RLS column grants (see migration 0006) — this route is the only
 * path that can set it, and it always derives the user id from the
 * authenticated session, never from the request body.
 */
export async function POST(request: Request) {
  const auth = await verifyAuthenticatedUser();
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth.data;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 400 },
    );
  }

  // Re-derive what's actually required server-side rather than trusting
  // the client's accepted-document list as sufficient on its own.
  const requiredDocuments = await getRequiredLegalDocuments(supabase);
  const acceptedIds = new Set(parsed.data.acceptedDocumentIds);
  const missingRequired = requiredDocuments.filter((doc) => !acceptedIds.has(doc.id));

  if (requiredDocuments.length > 0 && missingRequired.length > 0) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "You must accept all required agreements to continue.",
          details: { missingSlugs: missingRequired.map((d) => d.slug) },
        },
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      timezone: parsed.data.timezone,
      profession: parsed.data.profession ?? null,
      experience_level: parsed.data.experienceLevel ?? null,
      primary_goal: parsed.data.primaryGoal ?? null,
      onboarding_completed_at: now,
      // Cheap "has this user accepted anything, ever" flag for simple UI
      // checks — legal_acceptances (written below) is the actual source
      // of truth, per REQUIRED_LEGAL_SLUGS / ADR-004.
      terms_accepted_at: requiredDocuments.length > 0 ? now : null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message: error.message } }, { status: 502 });
  }

  try {
    await recordLegalAcceptances(request, user.id, requiredDocuments);
  } catch (acceptanceError) {
    const message =
      acceptanceError instanceof Error ? acceptanceError.message : "Failed to record legal acceptance";
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message } }, { status: 502 });
  }

  const response = NextResponse.json({ status: "completed" });
  // Fast-path hints for middleware; DB remains the source of truth for
  // both onboarding state and legal-acceptance state.
  response.cookies.set("va_onboarding_done", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  response.cookies.set("va_legal_current", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Deliberately much shorter than va_onboarding_done: this is a
    // freshness bound, not a "done forever" flag. Bounds how stale the
    // fast-path can get after an operator publishes a new required
    // document version — worst case, a user gets one extra bounce
    // through /legal/re-accept within this window (see ADR-003).
    maxAge: 60 * 60 * 24,
  });

  return response;
}
