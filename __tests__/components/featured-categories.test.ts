import { describe, it, expect } from "vitest";
import { CATEGORIES } from "@/components/LandingPage/FeaturedCategories";

describe("FeaturedCategories CATEGORIES config", () => {
  it("includes a Stickers entry", () => {
    const stickers = CATEGORIES.find((c) => c.label === "Stickers");
    expect(stickers).toBeDefined();
  });

  it("Stickers entry routes to /shop?category=STICKERS", () => {
    const stickers = CATEGORIES.find((c) => c.label === "Stickers");
    expect(stickers?.href).toBe("/shop?category=STICKERS");
  });

  it("Stickers entry uses the hero-stickers image", () => {
    const stickers = CATEGORIES.find((c) => c.label === "Stickers");
    expect(stickers?.img).toBe("/hero-stickers.webp");
  });

  it("does not include a Goalkeeper entry", () => {
    const goalkeeper = CATEGORIES.find((c) => c.label === "Goalkeeper");
    expect(goalkeeper).toBeUndefined();
  });
});
