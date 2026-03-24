import { describe, it, expect } from "vitest";
import { normaliseCondition } from "@/lib/import/normalise-condition";

describe("normaliseCondition", () => {
  it("maps 'Brand new' → BRAND_NEW", () => expect(normaliseCondition("Brand new")).toBe("BRAND_NEW"));
  it("maps 'BNIB' → BRAND_NEW", () => expect(normaliseCondition("BNIB")).toBe("BRAND_NEW"));
  it("maps 'New with tags' → NEW_WITH_TAGS", () => expect(normaliseCondition("New with tags")).toBe("NEW_WITH_TAGS"));
  it("maps 'BNWT' → NEW_WITH_TAGS", () => expect(normaliseCondition("BNWT")).toBe("NEW_WITH_TAGS"));
  it("maps 'New without tags' → NEW_WITHOUT_TAGS", () => expect(normaliseCondition("New without tags")).toBe("NEW_WITHOUT_TAGS"));
  it("maps 'BNWOB' → NEW_WITHOUT_TAGS", () => expect(normaliseCondition("BNWOB")).toBe("NEW_WITHOUT_TAGS"));
  it("maps 'Like new' → USED_LIKE_NEW", () => expect(normaliseCondition("Like new")).toBe("USED_LIKE_NEW"));
  it("maps 'Excellent' → USED_LIKE_NEW", () => expect(normaliseCondition("Excellent")).toBe("USED_LIKE_NEW"));
  it("maps 'Good' → USED_GOOD", () => expect(normaliseCondition("Good")).toBe("USED_GOOD"));
  it("maps 'Very good' → USED_GOOD", () => expect(normaliseCondition("Very good")).toBe("USED_GOOD"));
  it("maps 'Fair' → USED_FAIR", () => expect(normaliseCondition("Fair")).toBe("USED_FAIR"));
  it("maps 'Acceptable' → USED_FAIR", () => expect(normaliseCondition("Acceptable")).toBe("USED_FAIR"));
  it("defaults unknown → USED_GOOD", () => expect(normaliseCondition("whatever")).toBe("USED_GOOD"));
  it("defaults empty → USED_GOOD", () => expect(normaliseCondition("")).toBe("USED_GOOD"));
});
