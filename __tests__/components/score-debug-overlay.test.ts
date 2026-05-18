import { describe, it, expect } from "vitest";
import ScoreDebugOverlay from "@/components/score-debug-overlay";

describe("ScoreDebugOverlay", () => {
  it("returns null when __score is absent (undefined)", () => {
    const result = ScoreDebugOverlay({ score: undefined });
    expect(result).toBeNull();
  });

  it("returns a non-null element when __score is present", () => {
    const result = ScoreDebugOverlay({ score: 0.87 });
    expect(result).not.toBeNull();
  });

  it("includes the score rounded to 2 decimal places in the rendered output", () => {
    const result = ScoreDebugOverlay({ score: 0.87654 });
    expect(JSON.stringify(result)).toContain("0.88");
  });

  it("renders score of 0 without hiding it", () => {
    const result = ScoreDebugOverlay({ score: 0 });
    expect(JSON.stringify(result)).toContain("0.00");
  });

  it("renders score of 1 correctly", () => {
    const result = ScoreDebugOverlay({ score: 1 });
    expect(JSON.stringify(result)).toContain("1.00");
  });
});
