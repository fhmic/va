import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleAuthCallback } from "@/lib/supabase/auth-callback";

/**
 * Handles the redirect back from Supabase Auth after:
 *  - Google OAuth sign-in
 *  - Email confirmation link
 *  - Password recovery link
 * Exchanges the `code` param (or token hash for recovery links) for a session,
 * then routes the user onward. Middleware takes over from here for onboarding gating.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const supabase = await createClient();

  const nextPath = await handleAuthCallback({
    origin,
    searchParams,
    exchangeCodeForSession: (code) => supabase.auth.exchangeCodeForSession(code),
    verifyOtp: (params) => supabase.auth.verifyOtp(params),
  });

  return NextResponse.redirect(`${origin}${nextPath}`);
}
