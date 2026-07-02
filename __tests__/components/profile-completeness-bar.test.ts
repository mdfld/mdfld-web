import { describe, it, expect } from "vitest";
import { computeCompleteness } from "@/lib/compute-profile-completeness";

describe("computeCompleteness", () => {
  it("returns 0 when all fields empty", () => {
    expect(computeCompleteness({ imageUrl: "/avatars/1.png", bio: "", location: "", bannerUrl: "" })).toBe(0);
  });

  it("counts custom upload avatar (https URL) as 25%", () => {
    expect(computeCompleteness({ imageUrl: "https://utfs.io/f/abc123", bio: "", location: "", bannerUrl: "" })).toBe(25);
  });

  it("does not count auto-assigned template avatar (/avatars/N.png)", () => {
    expect(computeCompleteness({ imageUrl: "/avatars/3.png", bio: "", location: "", bannerUrl: "" })).toBe(0);
  });

  it("counts bio as 25%", () => {
    expect(computeCompleteness({ imageUrl: "", bio: "Football boot collector", location: "", bannerUrl: "" })).toBe(25);
  });

  it("counts location as 25%", () => {
    expect(computeCompleteness({ imageUrl: "", bio: "", location: "Atlanta, GA", bannerUrl: "" })).toBe(25);
  });

  it("counts banner as 25%", () => {
    expect(computeCompleteness({ imageUrl: "", bio: "", location: "", bannerUrl: "https://utfs.io/f/banner" })).toBe(25);
  });

  it("returns 100 when all fields complete", () => {
    expect(computeCompleteness({
      imageUrl: "https://utfs.io/f/abc",
      bio: "Some bio",
      location: "Atlanta, GA",
      bannerUrl: "https://utfs.io/f/banner",
    })).toBe(100);
  });

  it("returns 50 for bio + location", () => {
    expect(computeCompleteness({ imageUrl: "/avatars/1.png", bio: "Bio", location: "ATL", bannerUrl: "" })).toBe(50);
  });
});
