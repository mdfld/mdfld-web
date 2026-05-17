/**
 * A marketplace listing eligible for scoring.
 */
export interface ScoredListing {
  id: string;
  createdAt: Date;
  categoryId: string;
  sellerId: string;
  priceInCents: number;
  sellerVerified: boolean;
  viewCount: number;
  savedCount: number;
}

/**
 * Buyer context used to personalize listing scores.
 * All fields are optional — omitted fields are treated as "no preference."
 */
export interface ScoringContext {
  buyerCategoryId?: string;
  buyerPriceMinCents?: number;
  buyerPriceMaxCents?: number;
}

/**
 * Relative importance of each scoring dimension.
 * Weights do not need to sum to 1, but normalized weights (summing to 1)
 * produce a total score in [0, 1].
 */
export interface ScoringWeights {
  recencyWeight: number;
  relevanceWeight: number;
  trustWeight: number;
  priceWeight: number;
}

/**
 * Recency score: 1.0 for a brand-new listing, decaying linearly to 0 at 30 days old.
 * Listings older than 30 days always score 0.
 */
function computeRecencyScore(createdAt: Date): number {
  const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - daysSince / 30);
}

/**
 * Category match score: 1.0 if the listing category matches the buyer's preferred
 * category, or if the buyer has no category preference. 0.0 if categories differ.
 */
function computeCategoryMatchScore(categoryId: string, buyerCategoryId?: string): number {
  if (buyerCategoryId === undefined) return 1;
  return categoryId === buyerCategoryId ? 1 : 0;
}

/**
 * Verified seller score: 1.0 if the seller is verified, 0.0 otherwise.
 */
function computeVerifiedScore(sellerVerified: boolean): number {
  return sellerVerified ? 1 : 0;
}

/**
 * Price competitiveness score: 1.0 when no buyer price range is specified, when
 * the price falls within range, or when price is below the buyer's minimum (bargain).
 * Decays as max/price when price exceeds the buyer's maximum, approaching 0 as
 * price grows unbounded above max.
 */
function computePriceCompetitivenessScore(
  priceInCents: number,
  buyerPriceMinCents?: number,
  buyerPriceMaxCents?: number
): number {
  if (buyerPriceMaxCents !== undefined && priceInCents > buyerPriceMaxCents) {
    return Math.max(0, buyerPriceMaxCents / priceInCents);
  }
  return 1;
}

/**
 * Scores a listing on a weighted combination of four dimensions:
 *
 *   score = (recencyWeight    × recencyScore)
 *         + (relevanceWeight  × categoryMatchScore)
 *         + (trustWeight      × verifiedScore)
 *         + (priceWeight      × priceCompetitivenessScore)
 *
 * Each sub-score is a value in [0, 1]. When weights sum to 1 the result is
 * also in [0, 1].
 */
export function scoreListing(
  listing: ScoredListing,
  context: ScoringContext,
  weights: ScoringWeights
): number {
  return (
    weights.recencyWeight *
      computeRecencyScore(listing.createdAt) +
    weights.relevanceWeight *
      computeCategoryMatchScore(listing.categoryId, context.buyerCategoryId) +
    weights.trustWeight *
      computeVerifiedScore(listing.sellerVerified) +
    weights.priceWeight *
      computePriceCompetitivenessScore(
        listing.priceInCents,
        context.buyerPriceMinCents,
        context.buyerPriceMaxCents
      )
  );
}
