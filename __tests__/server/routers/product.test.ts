import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockProductFindMany } = vi.hoisted(() => ({
  mockProductFindMany: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      findMany: mockProductFindMany,
    },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {},
  formatAmountForStripe: vi.fn(),
}));

vi.mock("@/lib/scoring/getScoringWeights", () => ({
  getScoringWeights: vi.fn().mockResolvedValue({
    recencyWeight: 0.35,
    relevanceWeight: 0.3,
    trustWeight: 0.2,
    priceWeight: 0.15,
  }),
}));

vi.mock("@/lib/scoring/searchScoring", () => ({
  applyScoring: vi.fn((candidates: any[]) => candidates),
}));

import { createCallerFactory } from "@/server/trpc";
import { productRouter } from "@/server/routers/product";

const createCaller = createCallerFactory(productRouter);

const ctx = {
  req: {} as any,
  res: {} as any,
  session: null as any,
  user: null as any,
  prisma: { product: { findMany: mockProductFindMany } } as any,
};

describe("product.search verification status filter", () => {
  beforeEach(() => {
    mockProductFindMany.mockClear();
    mockProductFindMany.mockResolvedValue([]);
  });

  it("filters by a single verification status when provided", async () => {
    const caller = createCaller(ctx);
    await caller.search({ verificationStatuses: ["VERIFIED_AUTHENTIC"] });
    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          verificationStatus: { in: ["VERIFIED_AUTHENTIC"] },
        }),
      }),
    );
  });

  it("filters by multiple verification statuses when provided", async () => {
    const caller = createCaller(ctx);
    await caller.search({
      verificationStatuses: ["VERIFIED_AUTHENTIC", "UNVERIFIED"],
    });
    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          verificationStatus: { in: ["VERIFIED_AUTHENTIC", "UNVERIFIED"] },
        }),
      }),
    );
  });

  it("accepts FAN_MADE as a verification status filter", async () => {
    const caller = createCaller(ctx);
    await caller.search({ verificationStatuses: ["FAN_MADE"] });
    expect(mockProductFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          verificationStatus: { in: ["FAN_MADE"] },
        }),
      }),
    );
  });

  it("does not filter by verification status when omitted", async () => {
    const caller = createCaller(ctx);
    await caller.search({});
    const where = mockProductFindMany.mock.calls[0][0].where;
    expect(where).not.toHaveProperty("verificationStatus");
  });
});
