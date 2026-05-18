import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    platformSetting: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { getScoringWeights, _resetCache } from "@/lib/scoring/getScoringWeights";

const VALID_DB_WEIGHTS = {
  recencyWeight: 0.4,
  relevanceWeight: 0.3,
  trustWeight: 0.2,
  priceWeight: 0.1,
};

const DEFAULT_WEIGHTS = {
  recencyWeight: 0.35,
  relevanceWeight: 0.30,
  trustWeight: 0.20,
  priceWeight: 0.15,
};

describe("getScoringWeights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetCache();
  });

  it("returns weights from DB on successful read", async () => {
    vi.mocked(prisma.platformSetting.findUnique).mockResolvedValue({
      key: "listing_scoring_weights",
      value: VALID_DB_WEIGHTS,
      updatedAt: new Date(),
    });
    const weights = await getScoringWeights();
    expect(weights).toEqual(VALID_DB_WEIGHTS);
    expect(prisma.platformSetting.findUnique).toHaveBeenCalledWith({
      where: { key: "listing_scoring_weights" },
    });
  });

  it("falls back to defaults when DB returns null", async () => {
    vi.mocked(prisma.platformSetting.findUnique).mockResolvedValue(null);
    const weights = await getScoringWeights();
    expect(weights).toEqual(DEFAULT_WEIGHTS);
  });

  it("falls back to defaults when value is missing required keys", async () => {
    vi.mocked(prisma.platformSetting.findUnique).mockResolvedValue({
      key: "listing_scoring_weights",
      value: { recencyWeight: 0.4 },
      updatedAt: new Date(),
    });
    const weights = await getScoringWeights();
    expect(weights).toEqual(DEFAULT_WEIGHTS);
  });

  it("falls back to defaults when weight values are not numbers", async () => {
    vi.mocked(prisma.platformSetting.findUnique).mockResolvedValue({
      key: "listing_scoring_weights",
      value: { recencyWeight: "0.4", relevanceWeight: 0.3, trustWeight: 0.2, priceWeight: 0.1 },
      updatedAt: new Date(),
    });
    const weights = await getScoringWeights();
    expect(weights).toEqual(DEFAULT_WEIGHTS);
  });

  it("falls back to defaults on DB error", async () => {
    vi.mocked(prisma.platformSetting.findUnique).mockRejectedValue(
      new Error("connection failed")
    );
    const weights = await getScoringWeights();
    expect(weights).toEqual(DEFAULT_WEIGHTS);
  });

  it("returns cached value without hitting Prisma again within 60s", async () => {
    vi.mocked(prisma.platformSetting.findUnique).mockResolvedValue({
      key: "listing_scoring_weights",
      value: VALID_DB_WEIGHTS,
      updatedAt: new Date(),
    });
    await getScoringWeights(); // first call — hits DB
    await getScoringWeights(); // second call — should use cache
    expect(prisma.platformSetting.findUnique).toHaveBeenCalledTimes(1);
  });

  it("re-fetches from DB after 60s cache expiry", async () => {
    vi.useFakeTimers();
    vi.mocked(prisma.platformSetting.findUnique).mockResolvedValue({
      key: "listing_scoring_weights",
      value: VALID_DB_WEIGHTS,
      updatedAt: new Date(),
    });
    await getScoringWeights(); // populates cache
    vi.advanceTimersByTime(61_000);
    await getScoringWeights(); // cache expired — hits DB again
    expect(prisma.platformSetting.findUnique).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
