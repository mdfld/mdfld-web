import { describe, it, expect } from "vitest";
import { toScoredListing, applyScoring } from "@/lib/scoring/searchScoring";
import type { ScoringContext, ScoringWeights } from "@/lib/scoring/listingScore";

type FakeProduct = {
  id: string;
  createdAt: Date;
  category: string;
  price: { toNumber(): number };
  sellerProfileId: string;
  seller: { stripeOnboardingComplete: boolean };
};

function makeProduct(overrides: Partial<FakeProduct> = {}): FakeProduct {
  return {
    id: "prod-1",
    createdAt: new Date(),
    category: "BOOTS",
    price: { toNumber: () => 100 },
    sellerProfileId: "seller-1",
    seller: { stripeOnboardingComplete: false },
    ...overrides,
  };
}

const EQUAL_WEIGHTS: ScoringWeights = {
  recencyWeight: 0.25,
  relevanceWeight: 0.25,
  trustWeight: 0.25,
  priceWeight: 0.25,
};

describe("toScoredListing", () => {
  it("converts price in dollars to cents", () => {
    const product = makeProduct({ price: { toNumber: () => 99.99 } });
    const scored = toScoredListing(product);
    expect(scored.priceInCents).toBe(9999);
  });

  it("uses category enum value as categoryId", () => {
    const product = makeProduct({ category: "JERSEYS" });
    const scored = toScoredListing(product);
    expect(scored.categoryId).toBe("JERSEYS");
  });

  it("reflects seller.stripeOnboardingComplete as sellerVerified", () => {
    const verified = toScoredListing(
      makeProduct({ seller: { stripeOnboardingComplete: true } }),
    );
    expect(verified.sellerVerified).toBe(true);

    const unverified = toScoredListing(
      makeProduct({ seller: { stripeOnboardingComplete: false } }),
    );
    expect(unverified.sellerVerified).toBe(false);
  });

  it("defaults viewCount and savedCount to 0", () => {
    const scored = toScoredListing(makeProduct());
    expect(scored.viewCount).toBe(0);
    expect(scored.savedCount).toBe(0);
  });

  it("maps sellerProfileId to sellerId", () => {
    const product = makeProduct({ sellerProfileId: "seller-xyz" });
    expect(toScoredListing(product).sellerId).toBe("seller-xyz");
  });
});

describe("applyScoring", () => {
  it("returns at most 50 items from a large candidate pool", () => {
    const products = Array.from({ length: 200 }, (_, i) =>
      makeProduct({ id: `prod-${i}` }),
    );
    const result = applyScoring(products, {}, EQUAL_WEIGHTS);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it("sorts results by score descending", () => {
    const old = makeProduct({
      id: "old",
      createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    });
    const fresh = makeProduct({ id: "fresh", createdAt: new Date() });
    const weights: ScoringWeights = {
      recencyWeight: 1,
      relevanceWeight: 0,
      trustWeight: 0,
      priceWeight: 0,
    };
    const result = applyScoring([old, fresh], {}, weights);
    expect(result[0].id).toBe("fresh");
    expect(result[1].id).toBe("old");
  });

  it("ranks category-matching listing above non-matching when relevance weight is high", () => {
    const boots = makeProduct({
      id: "boots",
      category: "BOOTS",
      createdAt: new Date(),
    });
    const jerseys = makeProduct({
      id: "jerseys",
      category: "JERSEYS",
      createdAt: new Date(),
    });
    const weights: ScoringWeights = {
      recencyWeight: 0,
      relevanceWeight: 1,
      trustWeight: 0,
      priceWeight: 0,
    };
    const context: ScoringContext = { buyerCategoryId: "BOOTS" };
    const result = applyScoring([jerseys, boots], context, weights);
    expect(result[0].id).toBe("boots");
  });

  it("does not add __score field when dev is false", () => {
    const product = makeProduct();
    const result = applyScoring([product], {}, EQUAL_WEIGHTS, false);
    expect((result[0] as any).__score).toBeUndefined();
  });

  it("adds a numeric __score field when dev is true", () => {
    const product = makeProduct();
    const result = applyScoring([product], {}, EQUAL_WEIGHTS, true);
    expect(typeof (result[0] as any).__score).toBe("number");
  });
});
