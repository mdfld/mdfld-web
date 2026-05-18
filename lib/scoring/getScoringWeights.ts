import { prisma } from "@/lib/prisma";
import type { ScoringWeights } from "./listingScore";

const DEFAULT_WEIGHTS: ScoringWeights = {
  recencyWeight: 0.35,
  relevanceWeight: 0.30,
  trustWeight: 0.20,
  priceWeight: 0.15,
};

const CACHE_TTL_MS = 60_000;

let cache: { weights: ScoringWeights; cachedAt: number } | null = null;

/** Clears the in-memory cache. Exported for use in tests only. */
export function _resetCache(): void {
  cache = null;
}

function isValidWeights(value: unknown): value is ScoringWeights {
  if (typeof value !== "object" || value === null) return false;
  const w = value as Record<string, unknown>;
  return (
    typeof w.recencyWeight === "number" &&
    typeof w.relevanceWeight === "number" &&
    typeof w.trustWeight === "number" &&
    typeof w.priceWeight === "number"
  );
}

/**
 * Returns the active scoring weights.
 * Reads from `platform_settings` where key = "listing_scoring_weights",
 * validates the JSON shape, and caches the result for 60 seconds.
 * Falls back to hardcoded defaults if the DB read fails or the value is malformed.
 */
export async function getScoringWeights(): Promise<ScoringWeights> {
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return cache.weights;
  }

  try {
    const row = await prisma.platformSetting.findUnique({
      where: { key: "listing_scoring_weights" },
    });

    if (row && isValidWeights(row.value)) {
      cache = { weights: row.value, cachedAt: Date.now() };
      return cache.weights;
    }
  } catch {
    // fall through to default
  }

  cache = { weights: DEFAULT_WEIGHTS, cachedAt: Date.now() };
  return cache.weights;
}
