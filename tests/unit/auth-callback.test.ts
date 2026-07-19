import { describe, expect, it, vi } from "vitest";
import { handleAuthCallback } from "@/lib/supabase/auth-callback";

describe("handleAuthCallback", () => {
  it("exchanges a standard auth code for a session", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    const verifyOtp = vi.fn();

    const result = await handleAuthCallback({
      origin: "https://app.example.com",
      searchParams: new URLSearchParams("code=abc123"),
      exchangeCodeForSession,
      verifyOtp,
    });

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(result).toBe("/dashboard");
  });

  it("verifies recovery token hashes when no code is present", async () => {
    const exchangeCodeForSession = vi.fn();
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });

    const result = await handleAuthCallback({
      origin: "https://app.example.com",
      searchParams: new URLSearchParams("token_hash=token-123&type=recovery"),
      exchangeCodeForSession,
      verifyOtp,
    });

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "token-123", type: "recovery" });
    expect(result).toBe("/update-password");
  });
});
