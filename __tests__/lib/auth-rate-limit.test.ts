import { describe, it, expect } from "vitest";
import { auth } from "../../lib/auth";

// Brute-force protection: better-auth's built-in rate limiter must stay
// enabled with strict rules on credential endpoints. These assertions guard
// against the config being dropped in a refactor.
describe("auth rate limiting", () => {
  it("is enabled", () => {
    expect(auth.options.rateLimit?.enabled).toBe(true);
  });

  it("limits sign-in attempts", () => {
    const rule = auth.options.rateLimit?.customRules?.["/sign-in/email"];
    expect(rule).toBeDefined();
    expect(rule!.max).toBeLessThanOrEqual(10);
  });

  it("limits sign-up attempts", () => {
    const rule = auth.options.rateLimit?.customRules?.["/sign-up/email"];
    expect(rule).toBeDefined();
    expect(rule!.max).toBeLessThanOrEqual(10);
  });

  it("limits password reset requests", () => {
    for (const path of [
      "/forget-password",
      "/request-password-reset",
    ] as const) {
      const rule = auth.options.rateLimit?.customRules?.[path];
      expect(rule, path).toBeDefined();
      expect(rule!.max, path).toBeLessThanOrEqual(5);
    }
  });
});
