import { scoreListing } from "./listingScore";
import type { ScoredListing, ScoringContext, ScoringWeights } from "./listingScore";

type ProductWithSeller = {
  id: string;
  createdAt: Date;
  category: string;
  price: { toNumber(): number } | number;
  sellerProfileId: string;
  seller: { stripeOnboardingComplete: boolean };
};

export function toScoredListing(product: ProductWithSeller): ScoredListing {
  const dollars =
    typeof product.price === "number"
      ? product.price
      : product.price.toNumber();
  return {
    id: product.id,
    createdAt: product.createdAt,
    categoryId: String(product.category),
    sellerId: product.sellerProfileId,
    priceInCents: Math.round(dollars * 100),
    sellerVerified: product.seller.stripeOnboardingComplete,
    viewCount: 0,
    savedCount: 0,
  };
}

export function applyScoring<T extends ProductWithSeller>(
  products: T[],
  context: ScoringContext,
  weights: ScoringWeights,
  dev = process.env.NODE_ENV === "development",
): (T & { __score?: number })[] {
  const scored = products.map((p) => ({
    product: p,
    score: scoreListing(toScoredListing(p), context, weights),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 50).map(({ product, score }) =>
    dev ? { ...product, __score: score } : product,
  );
}
