type AuthCallbackResult = {
  nextPath: string;
};

type VerifyOtpParams = {
  token_hash: string;
  type: string;
};

type AuthCallbackDeps = {
  origin: string;
  searchParams: URLSearchParams;
  exchangeCodeForSession: (code: string) => Promise<{ error: { message?: string } | null } | null>;
  verifyOtp: (params: VerifyOtpParams) => Promise<{ error: { message?: string } | null } | null>;
};

export async function handleAuthCallback({
  origin,
  searchParams,
  exchangeCodeForSession,
  verifyOtp,
}: AuthCallbackDeps): Promise<string> {
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (code) {
    const result = await exchangeCodeForSession(code);
    if (!result?.error) {
      return type === "recovery" ? "/update-password" : "/dashboard";
    }
  }

  if (tokenHash && type) {
    const result = await verifyOtp({ token_hash: tokenHash, type });
    if (!result?.error) {
      return type === "recovery" ? "/update-password" : "/dashboard";
    }
  }

  return "/sign-in?error=auth_callback_failed";
}
