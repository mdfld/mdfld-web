import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindUnique, mockFindMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
    },
  },
}));

import {
  scoreRelatedProduct,
  getRelatedProducts,
  DEFAULT_RELATED_PRODUCTS_LIMIT,
} from "@/lib/related-products";
import type { RelatedProductScoringFields } from "@/lib/related-products";

const BASE: RelatedProductScoringFields = {
  id: "source-1",
  category: "JERSEYS",
  subcategory: "GAME_JERSEYS",
  brand: "Nike",
  tags: ["retro", "home"],
  collectibleTeam: null,
  price: 100,
};

function decimal(value: number) {
  return { toNumber: () => value } as any;
}

describe("scoreRelatedProduct", () => {
  it("scores an identical category, brand, subcategory, tags, and price match highest", () => {
    const score = scoreRelatedProduct({ ...BASE, id: "candidate-1" }, BASE);
    expect(score).toBe(9);
  });

  it("scores 0 when nothing matches", () => {
    const candidate: RelatedProductScoringFields = {
      id: "candidate-2",
      category: "BOOTS",
      subcategory: null,
      brand: "Adidas",
      tags: [],
      collectibleTeam: null,
      price: 9999,
    };
    expect(scoreRelatedProduct(candidate, BASE)).toBe(0);
  });

  it("weights category match higher than brand match", () => {
    const categoryMatch: RelatedProductScoringFields = {
      ...BASE,
      id: "candidate-3",
      brand: "Adidas",
    };
    const brandOnlyMatch: RelatedProductScoringFields = {
      ...BASE,
      id: "candidate-4",
      category: "BOOTS",
      subcategory: null,
      tags: [],
    };
    expect(scoreRelatedProduct(categoryMatch, BASE)).toBeGreaterThan(
      scoreRelatedProduct(brandOnlyMatch, BASE),
    );
  });

  it("scores a team match for collectibles", () => {
    const source: RelatedProductScoringFields = {
      ...BASE,
      category: "COLLECTIBLES",
      brand: null,
      collectibleTeam: "Real Madrid",
    };
    const candidate: RelatedProductScoringFields = {
      ...source,
      id: "candidate-5",
      collectibleTeam: "Real Madrid",
    };
    const noTeamCandidate: RelatedProductScoringFields = {
      ...source,
      id: "candidate-6",
      collectibleTeam: "Barcelona",
    };
    expect(scoreRelatedProduct(candidate, source)).toBeGreaterThan(
      scoreRelatedProduct(noTeamCandidate, source),
    );
  });

  it("caps the shared-tag bonus at 3 tags", () => {
    const source: RelatedProductScoringFields = {
      ...BASE,
      category: "OTHER",
      brand: null,
      tags: ["a", "b", "c", "d", "e"],
    };
    const fiveShared: RelatedProductScoringFields = { ...source, id: "candidate-7" };
    const threeShared: RelatedProductScoringFields = {
      ...source,
      id: "candidate-8",
      tags: ["a", "b", "c"],
    };
    expect(scoreRelatedProduct(fiveShared, source)).toBe(
      scoreRelatedProduct(threeShared, source),
    );
  });

  it("gives a price-proximity bonus within 30% of the source price", () => {
    const close: RelatedProductScoringFields = { ...BASE, id: "candidate-9", price: 120, tags: [] };
    const far: RelatedProductScoringFields = { ...BASE, id: "candidate-10", price: 500, tags: [] };
    expect(scoreRelatedProduct(close, BASE)).toBeGreaterThan(scoreRelatedProduct(far, BASE));
  });
});

describe("getRelatedProducts", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockFindMany.mockReset();
  });

  it("returns an empty array when the source product doesn't exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await getRelatedProducts("missing-id");
    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("queries candidates matching category, brand, team, or tags, excluding the source product", async () => {
    mockFindUnique.mockResolvedValue({
      id: "source-1",
      category: "JERSEYS",
      subcategory: "GAME_JERSEYS",
      brand: "Nike",
      tags: ["retro"],
      collectibleTeam: null,
      price: decimal(100),
    });
    mockFindMany.mockResolvedValue([]);

    await getRelatedProducts("source-1");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "source-1" },
          isActive: true,
          OR: expect.arrayContaining([
            { category: "JERSEYS" },
            { brand: "Nike" },
            { tags: { hasSome: ["retro"] } },
          ]),
        }),
      }),
    );
  });

  it("ranks candidates by relevance score and respects the limit", async () => {
    mockFindUnique.mockResolvedValue({
      id: "source-1",
      category: "JERSEYS",
      subcategory: null,
      brand: "Nike",
      tags: [],
      collectibleTeam: null,
      price: decimal(100),
    });
    mockFindMany.mockResolvedValue([
      { id: "low", category: "OTHER", subcategory: null, brand: null, tags: [], collectibleTeam: null, price: decimal(9999) },
      { id: "high", category: "JERSEYS", subcategory: null, brand: "Nike", tags: [], collectibleTeam: null, price: decimal(105) },
      { id: "mid", category: "JERSEYS", subcategory: null, brand: null, tags: [], collectibleTeam: null, price: decimal(9999) },
    ]);

    const result = await getRelatedProducts("source-1", 2);

    expect(result.map((p: any) => p.id)).toEqual(["high", "mid"]);
  });

  it("defaults to DEFAULT_RELATED_PRODUCTS_LIMIT results", async () => {
    mockFindUnique.mockResolvedValue({
      id: "source-1",
      category: "JERSEYS",
      subcategory: null,
      brand: null,
      tags: [],
      collectibleTeam: null,
      price: decimal(100),
    });
    mockFindMany.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({
        id: `candidate-${i}`,
        category: "JERSEYS",
        subcategory: null,
        brand: null,
        tags: [],
        collectibleTeam: null,
        price: decimal(100),
      })),
    );

    const result = await getRelatedProducts("source-1");
    expect(result).toHaveLength(DEFAULT_RELATED_PRODUCTS_LIMIT);
  });
});
