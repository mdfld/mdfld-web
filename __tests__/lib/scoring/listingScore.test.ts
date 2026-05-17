import { describe, it, expect } from "vitest";
import { scoreListing } from "@/lib/scoring/listingScore";
import type { ScoredListing, ScoringContext, ScoringWeights } from "@/lib/scoring/listingScore";

const BASE_LISTING: ScoredListing = {
  id: "listing-1",
  createdAt: new Date(),
  categoryId: "boots",
  sellerId: "seller-1",
  priceInCents: 10000,
  sellerVerified: true,
  viewCount: 100,
  savedCount: 10,
};

const EQUAL_WEIGHTS: ScoringWeights = {
  recencyWeight: 0.25,
  relevanceWeight: 0.25,
  trustWeight: 0.25,
  priceWeight: 0.25,
};

const EMPTY_CONTEXT: ScoringContext = {};

describe("scoreListing", () => {
  describe("return value", () => {
    it("returns a number", () => {
      const score = scoreListing(BASE_LISTING, EMPTY_CONTEXT, EQUAL_WEIGHTS);
      expect(typeof score).toBe("number");
    });

    it("returns 0 when all weights are 0", () => {
      const zeroWeights: ScoringWeights = {
        recencyWeight: 0,
        relevanceWeight: 0,
        trustWeight: 0,
        priceWeight: 0,
      };
      expect(scoreListing(BASE_LISTING, EMPTY_CONTEXT, zeroWeights)).toBe(0);
    });
  });

  describe("recency sub-score", () => {
    it("scores a brand-new listing near 1 when only recency weight is set", () => {
      const weights: ScoringWeights = { recencyWeight: 1, relevanceWeight: 0, trustWeight: 0, priceWeight: 0 };
      const score = scoreListing({ ...BASE_LISTING, createdAt: new Date() }, EMPTY_CONTEXT, weights);
      expect(score).toBeGreaterThan(0.95);
    });

    it("scores a 30+ day old listing at 0", () => {
      const weights: ScoringWeights = { recencyWeight: 1, relevanceWeight: 0, trustWeight: 0, priceWeight: 0 };
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      const score = scoreListing({ ...BASE_LISTING, createdAt: oldDate }, EMPTY_CONTEXT, weights);
      expect(score).toBe(0);
    });
  });

  describe("category match sub-score", () => {
    it("scores 1 when no buyerCategoryId is provided", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 1, trustWeight: 0, priceWeight: 0 };
      expect(scoreListing(BASE_LISTING, {}, weights)).toBe(1);
    });

    it("scores 1 when listing category matches buyer category", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 1, trustWeight: 0, priceWeight: 0 };
      expect(scoreListing(BASE_LISTING, { buyerCategoryId: "boots" }, weights)).toBe(1);
    });

    it("scores 0 when listing category does not match buyer category", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 1, trustWeight: 0, priceWeight: 0 };
      expect(scoreListing(BASE_LISTING, { buyerCategoryId: "jerseys" }, weights)).toBe(0);
    });
  });

  describe("verified seller sub-score", () => {
    it("scores 1 for a verified seller", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 0, trustWeight: 1, priceWeight: 0 };
      expect(scoreListing({ ...BASE_LISTING, sellerVerified: true }, EMPTY_CONTEXT, weights)).toBe(1);
    });

    it("scores 0 for an unverified seller", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 0, trustWeight: 1, priceWeight: 0 };
      expect(scoreListing({ ...BASE_LISTING, sellerVerified: false }, EMPTY_CONTEXT, weights)).toBe(0);
    });
  });

  describe("price competitiveness sub-score", () => {
    it("scores 1 when no buyer price range is specified", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 0, trustWeight: 0, priceWeight: 1 };
      expect(scoreListing(BASE_LISTING, {}, weights)).toBe(1);
    });

    it("scores 1 when price is within buyer range", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 0, trustWeight: 0, priceWeight: 1 };
      const context: ScoringContext = { buyerPriceMinCents: 5000, buyerPriceMaxCents: 20000 };
      expect(scoreListing(BASE_LISTING, context, weights)).toBe(1);
    });

    it("scores 0.5 when price is exactly double the buyer max", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 0, trustWeight: 0, priceWeight: 1 };
      const listing = { ...BASE_LISTING, priceInCents: 20000 };
      const context: ScoringContext = { buyerPriceMaxCents: 10000 };
      expect(scoreListing(listing, context, weights)).toBeCloseTo(0.5);
    });

    it("scores 1 when price is below buyer min (treated as a bargain)", () => {
      const weights: ScoringWeights = { recencyWeight: 0, relevanceWeight: 0, trustWeight: 0, priceWeight: 1 };
      const context: ScoringContext = { buyerPriceMinCents: 20000, buyerPriceMaxCents: 50000 };
      expect(scoreListing(BASE_LISTING, context, weights)).toBe(1);
    });
  });

  describe("weight application", () => {
    it("sums weighted sub-scores correctly across all four dimensions", () => {
      const listing: ScoredListing = {
        ...BASE_LISTING,
        createdAt: new Date(),
        sellerVerified: true,
        categoryId: "boots",
      };
      const context: ScoringContext = {
        buyerCategoryId: "boots",
        buyerPriceMinCents: 5000,
        buyerPriceMaxCents: 20000,
      };
      const weights: ScoringWeights = {
        recencyWeight: 0.4,
        relevanceWeight: 0.3,
        trustWeight: 0.2,
        priceWeight: 0.1,
      };
      const score = scoreListing(listing, context, weights);
      expect(score).toBeGreaterThan(0.95);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });
});
