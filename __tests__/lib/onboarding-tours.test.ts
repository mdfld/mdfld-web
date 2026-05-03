import { describe, it, expect } from "vitest";
import { TOURS } from "@/lib/onboarding-tours.config";
import type { TourPageId } from "@/types/onboarding";

const REQUIRED_TOUR_IDS: TourPageId[] = [
  'dashboard', 'bag', 'returns', 'connect', 'org-setup', 'org-profile',
];

describe("onboarding-tours.config", () => {
  it("exports a TOURS array", () => {
    expect(Array.isArray(TOURS)).toBe(true);
  });

  it("includes all required page tours", () => {
    const ids = TOURS.map((t) => t.pageId);
    for (const required of REQUIRED_TOUR_IDS) {
      expect(ids).toContain(required);
    }
  });

  it("every tour has at least one step", () => {
    for (const tour of TOURS) {
      expect(tour.steps.length).toBeGreaterThan(0);
    }
  });

  it("every step has a non-empty selector, title, and body", () => {
    for (const tour of TOURS) {
      for (const step of tour.steps) {
        expect(step.selector.trim().length).toBeGreaterThan(0);
        expect(step.title.trim().length).toBeGreaterThan(0);
        expect(step.body.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("all pageIds are unique", () => {
    const ids = TOURS.map((t) => t.pageId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
