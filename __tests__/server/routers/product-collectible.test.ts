import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockProductCreate, mockSellerFindUnique, mockOrgFindUnique } = vi.hoisted(() => ({
  mockProductCreate: vi.fn(),
  mockSellerFindUnique: vi.fn(),
  mockOrgFindUnique: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { create: mockProductCreate, findMany: vi.fn().mockResolvedValue([]) },
    sellerProfile: { findUnique: mockSellerFindUnique },
    organization: { findUnique: mockOrgFindUnique },
  },
}));
vi.mock('@/lib/stripe', () => ({ stripe: {} }));
vi.mock('@/lib/scoring/getScoringWeights', () => ({
  getScoringWeights: vi.fn().mockResolvedValue({ recencyWeight: 0.35, relevanceWeight: 0.3, trustWeight: 0.2, priceWeight: 0.15 }),
}));
vi.mock('@/lib/scoring/searchScoring', () => ({
  applyScoring: vi.fn((items: any[]) => items),
}));

import { createCallerFactory } from '@/server/trpc';
import { productRouter } from '@/server/routers/product';

const createCaller = createCallerFactory(productRouter);

const authedCtx = {
  req: {} as any,
  res: {} as any,
  session: { user: { id: 'u1' } } as any,
  user: { id: 'u1', role: 'SELLER' } as any,
  prisma: {
    product: { create: mockProductCreate, findMany: vi.fn().mockResolvedValue([]) },
    sellerProfile: { findUnique: mockSellerFindUnique },
    organization: { findUnique: mockOrgFindUnique },
  } as any,
};

const baseInput = {
  sellerProfileId: 'sp1',
  title: 'Test Product',
  description: 'A test product',
  price: 9.99,
  category: 'COLLECTIBLES' as const,
  condition: 'MINT' as const,
  images: ['https://example.com/img.jpg'],
  tags: [],
  inventory: 1,
  tradeEnabled: false,
};

describe('product.create - collectible fields', () => {
  beforeEach(() => {
    mockSellerFindUnique.mockResolvedValue({ id: 'sp1', userId: 'u1' });
    mockOrgFindUnique.mockResolvedValue(null);
    mockProductCreate.mockResolvedValue({ id: 'prod1', ...baseInput });
  });

  it('accepts MINT condition for COLLECTIBLES', async () => {
    const caller = createCaller(authedCtx);
    await caller.create(baseInput);
    expect(mockProductCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ condition: 'MINT' }) })
    );
  });

  it('passes collectible fields through to prisma', async () => {
    const caller = createCaller(authedCtx);
    await caller.create({
      ...baseInput,
      subcategory: 'STICKERS',
      collectibleCode: 'KOR14',
      setName: 'FIFA World Cup 2026',
      collectiblePublisher: 'Panini',
      collectiblePlayerName: 'Son Heung-min',
      collectibleTeam: 'South Korea',
      isPeeled: false,
    });
    expect(mockProductCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          collectibleCode: 'KOR14',
          setName: 'FIFA World Cup 2026',
          collectiblePublisher: 'Panini',
          collectiblePlayerName: 'Son Heung-min',
          collectibleTeam: 'South Korea',
          isPeeled: false,
        }),
      })
    );
  });

  it('passes football fields through to prisma', async () => {
    const caller = createCaller(authedCtx);
    await caller.create({
      ...baseInput,
      category: 'FOOTBALLS' as any,
      condition: 'BRAND_NEW' as const,
      ballSize: 5,
      ballGrade: 'PRO_MATCH' as any,
    });
    expect(mockProductCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ballSize: 5, ballGrade: 'PRO_MATCH' }),
      })
    );
  });
});

describe('product.search - collectible filters', () => {
  beforeEach(() => {
    authedCtx.prisma.product.findMany = vi.fn().mockResolvedValue([]);
  });

  it('filters by collectibleCode when provided', async () => {
    const caller = createCaller({ ...authedCtx, session: null, user: null });
    await caller.search({ collectibleCode: 'KOR14' });
    expect(authedCtx.prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          collectibleCode: { contains: 'KOR14', mode: 'insensitive' },
        }),
      })
    );
  });

  it('filters by setName when provided', async () => {
    const caller = createCaller({ ...authedCtx, session: null, user: null });
    await caller.search({ setName: 'World Cup 2026' });
    expect(authedCtx.prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          setName: { contains: 'World Cup 2026', mode: 'insensitive' },
        }),
      })
    );
  });

  it('filters by ballSize when provided', async () => {
    const caller = createCaller({ ...authedCtx, session: null, user: null });
    await caller.search({ ballSize: 5 });
    expect(authedCtx.prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ballSize: 5 }),
      })
    );
  });

  it('filters by ballGrade when provided', async () => {
    const caller = createCaller({ ...authedCtx, session: null, user: null });
    await caller.search({ ballGrade: 'PRO_MATCH' as any });
    expect(authedCtx.prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ ballGrade: 'PRO_MATCH' }),
      })
    );
  });

  it('filters by subcategory when provided', async () => {
    const caller = createCaller({ ...authedCtx, session: null, user: null });
    await caller.search({ subcategory: 'STICKERS' });
    expect(authedCtx.prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ subcategory: 'STICKERS' }),
      })
    );
  });
});
