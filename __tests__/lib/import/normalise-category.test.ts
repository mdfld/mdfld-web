import { describe, it, expect } from "vitest";
import { normaliseCategory } from "@/lib/import/normalise-category";

describe("normaliseCategory", () => {
  it("maps 'boot' → BOOTS", () => expect(normaliseCategory("boot")).toBe("BOOTS"));
  it("maps 'Football Boots' → BOOTS", () => expect(normaliseCategory("Football Boots")).toBe("BOOTS"));
  it("maps 'cleat' → BOOTS", () => expect(normaliseCategory("cleat")).toBe("BOOTS"));
  it("maps 'soccer cleat' → BOOTS", () => expect(normaliseCategory("soccer cleat")).toBe("BOOTS"));
  it("maps 'jersey' → JERSEYS", () => expect(normaliseCategory("jersey")).toBe("JERSEYS"));
  it("maps 'Football Kit' → JERSEYS", () => expect(normaliseCategory("Football Kit")).toBe("JERSEYS"));
  it("maps 'shirt' → JERSEYS", () => expect(normaliseCategory("shirt")).toBe("JERSEYS"));
  it("maps 'football' → FOOTBALLS", () => expect(normaliseCategory("football")).toBe("FOOTBALLS"));
  it("maps 'soccer ball' → FOOTBALLS", () => expect(normaliseCategory("soccer ball")).toBe("FOOTBALLS"));
  it("maps 'trading card' → COLLECTIBLES", () => expect(normaliseCategory("trading card")).toBe("COLLECTIBLES"));
  it("maps 'Panini' → COLLECTIBLES", () => expect(normaliseCategory("Panini")).toBe("COLLECTIBLES"));
  it("maps 'sticker' → COLLECTIBLES", () => expect(normaliseCategory("sticker")).toBe("COLLECTIBLES"));
  it("maps 'goalkeeper glove' → GOALKEEPER_GLOVES", () => expect(normaliseCategory("goalkeeper glove")).toBe("GOALKEEPER_GLOVES"));
  it("maps 'shin guard' → SHIN_GUARDS", () => expect(normaliseCategory("shin guard")).toBe("SHIN_GUARDS"));
  it("maps 'shin pad' → SHIN_GUARDS", () => expect(normaliseCategory("shin pad")).toBe("SHIN_GUARDS"));
  it("maps 'training' → TRAINING_EQUIPMENT", () => expect(normaliseCategory("training")).toBe("TRAINING_EQUIPMENT"));
  it("returns null for unrecognised", () => expect(normaliseCategory("random stuff")).toBeNull());
  it("returns null for empty string", () => expect(normaliseCategory("")).toBeNull());
});
