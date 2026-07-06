import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const DEFAULT_RELATED_PRODUCTS_LIMIT = 8;
const CANDIDATE_POOL_SIZE = 60;

export interface RelatedProductScoringFields {
  id: string;
  category: string;
  subcategory: string | null;
  brand: string | null;
  tags: string[];
  collectibleTeam: string | null;
  price: number;
}

export function scoreRelatedProduct(
  candidate: RelatedProductScoringFields,
  source: RelatedProductScoringFields,
): number {
  let score = 0;

  if (candidate.category === source.category) score += 4;
  if (source.collectibleTeam && candidate.collectibleTeam === source.collectibleTeam) {
    score += 3;
  }
  if (source.brand && candidate.brand === source.brand) score += 2;
  if (source.subcategory && candidate.subcategory === source.subcategory) score += 1;

  const sharedTags = candidate.tags.filter((tag) => source.tags.includes(tag));
  score += Math.min(sharedTags.length, 3) * 0.5;

  if (source.price > 0) {
    const priceDelta = Math.abs(candidate.price - source.price) / source.price;
    if (priceDelta <= 0.3) score += 1;
  }

  return score;
}

export async function getRelatedProducts(
  productId: string,
  limit: number = DEFAULT_RELATED_PRODUCTS_LIMIT,
) {
  const source = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      category: true,
      subcategory: true,
      brand: true,
      tags: true,
      collectibleTeam: true,
      price: true,
    },
  });

  if (!source) return [];

  const sourceFields: RelatedProductScoringFields = {
    id: source.id,
    category: source.category,
    subcategory: source.subcategory,
    brand: source.brand,
    tags: source.tags,
    collectibleTeam: source.collectibleTeam,
    price: source.price.toNumber(),
  };

  const candidateFilters: Prisma.ProductWhereInput[] = [
    { category: source.category },
  ];
  if (source.brand) candidateFilters.push({ brand: source.brand });
  if (source.collectibleTeam) {
    candidateFilters.push({ collectibleTeam: source.collectibleTeam });
  }
  if (source.tags.length > 0) {
    candidateFilters.push({ tags: { hasSome: source.tags } });
  }

  const candidates = await prisma.product.findMany({
    where: {
      id: { not: source.id },
      isActive: true,
      inventory: { gt: 0 },
      OR: candidateFilters,
    },
    take: CANDIDATE_POOL_SIZE,
    orderBy: { createdAt: "desc" },
    include: {
      seller: {
        select: { id: true, storeName: true, averageRating: true },
      },
    },
  });

  return candidates
    .map((candidate) => ({
      product: candidate,
      score: scoreRelatedProduct(
        {
          id: candidate.id,
          category: candidate.category,
          subcategory: candidate.subcategory,
          brand: candidate.brand,
          tags: candidate.tags,
          collectibleTeam: candidate.collectibleTeam,
          price: candidate.price.toNumber(),
        },
        sourceFields,
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ product }) => product);
}
