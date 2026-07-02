import { describe, it, expect } from "vitest";
import { HELP_CONTENT, searchHelp } from "@/lib/help-content";

describe("HELP_CONTENT", () => {
  it("has exactly 5 sections", () => {
    expect(HELP_CONTENT).toHaveLength(5);
  });

  it("section ids are unique", () => {
    const ids = HELP_CONTENT.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every section has at least 3 questions", () => {
    for (const section of HELP_CONTENT) {
      expect(section.questions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("every question has a non-empty q and a", () => {
    for (const section of HELP_CONTENT) {
      for (const item of section.questions) {
        expect(item.q.length).toBeGreaterThan(0);
        expect(item.a.length).toBeGreaterThan(0);
      }
    }
  });

  it("section labels match expected values", () => {
    const labels = HELP_CONTENT.map((s) => s.label);
    expect(labels).toEqual(["Buying", "Selling", "Authentication", "Returns", "Contact"]);
  });
});

describe("searchHelp", () => {
  it("returns empty array for empty query", () => {
    expect(searchHelp("")).toEqual([]);
  });

  it("returns empty array for whitespace-only query", () => {
    expect(searchHelp("   ")).toEqual([]);
  });

  it("finds questions matching query (case-insensitive)", () => {
    const results = searchHelp("checkout");
    expect(results.length).toBeGreaterThan(0);
    const allMatch = results.every(
      (r) =>
        r.q.toLowerCase().includes("checkout") ||
        r.a.toLowerCase().includes("checkout")
    );
    expect(allMatch).toBe(true);
  });

  it("attaches sectionLabel to each result", () => {
    const results = searchHelp("checkout");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(typeof r.sectionLabel).toBe("string");
      expect(r.sectionLabel.length).toBeGreaterThan(0);
    }
  });

  it("returns no results for nonsense query", () => {
    expect(searchHelp("xyzzy_no_match_ever")).toEqual([]);
  });
});
