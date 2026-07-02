import { describe, it, expect } from "vitest";
import { resolveSellerAction } from "@/lib/seller-action";

describe("resolveSellerAction", () => {
  it("returns 'hidden' when sellerId is undefined", () => {
    expect(resolveSellerAction(undefined, undefined)).toBe("hidden");
  });

  it("returns 'hidden' when sellerId is undefined even with a logged-in user", () => {
    expect(resolveSellerAction("user-123", undefined)).toBe("hidden");
  });

  it("returns 'guest' when user is not logged in and sellerId exists", () => {
    expect(resolveSellerAction(undefined, "seller-456")).toBe("guest");
  });

  it("returns 'edit' when the current user is the seller", () => {
    expect(resolveSellerAction("user-123", "user-123")).toBe("edit");
  });

  it("returns 'message' when logged-in user is not the seller", () => {
    expect(resolveSellerAction("user-123", "seller-456")).toBe("message");
  });
});
