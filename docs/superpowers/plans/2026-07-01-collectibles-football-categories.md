# Collectibles & Football Category System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce category-aware listing fields, condition scales, and search filters that distinguish Wearables, Collectibles (stickers/trading cards), and Footballs.

**Architecture:** A `CATEGORY_GROUP` constant in `lib/constants/product-categories.ts` acts as the single source of truth for which UI to render. The DB gets new nullable fields on `Product` and new/extended enums. tRPC procedures accept new optional fields. UI components read `getCategoryGroup(category)` to branch form fields, filter sections, and display attributes.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, PostgreSQL, tRPC, HeroUI, Vitest

## Global Constraints

- All new Product fields are nullable — never required for wearable listings
- Run `npx vitest run` after every task to confirm no regressions
- Run `npx tsc --noEmit` after every task — ignore the pre-existing error in `components/dashboard/organizations/team/app.tsx`
- Commit per task, never batch commits across tasks
- No em dashes in any string content — use commas, colons, or hyphens

---

## File Map

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add BallGrade enum, extend ProductCondition + ProductCategory + ProductSubcategory, add nullable fields to Product |
| `prisma/migrations/` | Two migrations: (1) additive schema + data migration, (2) raw SQL to remove old enum values |
| `lib/constants/product-categories.ts` | Add COLLECTIBLES, CATEGORY_GROUPS, getCategoryGroup(), condition/grade/size constants |
| `server/routers/product.ts` | Extend createProductSchema and search input with new fields |
| `components/dashboard/organizations/products/create/product-creation.tsx` | Extend ProductFormData type, pass new fields to mutation |
| `components/dashboard/organizations/products/create/product-basic-form.tsx` | Category-aware category list, subcategory field, condition options |
| `components/dashboard/organizations/products/create/product-details-form.tsx` | Category-aware collectible and football fields |
| `components/product-filters.tsx` | Category-aware filter sections for collectible and football |
| `app/(main)/products/products-page-client.tsx` | Pass collectible/football filter state to search query |
| `app/(main)/products/[product]/page.tsx` | Category-aware attribute display |
| `__tests__/lib/product-categories.test.ts` | Unit tests for getCategoryGroup helper |
| `__tests__/server/routers/product-collectible.test.ts` | tRPC tests for create + search with new fields |

---

## Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_collectibles_football_schema/migration.sql`

**Interfaces:**
- Produces: `BallGrade` enum, extended `ProductCondition`, `COLLECTIBLES` in `ProductCategory`, `STICKERS`/`TRADING_CARDS` in `ProductSubcategory`, nullable fields `collectibleCode`, `setName`, `collectiblePublisher`, `collectiblePlayerName`, `collectibleTeam`, `isPeeled`, `ballSize`, `ballGrade` on `Product`

- [ ] **Step 1: Update prisma/schema.prisma — add BallGrade enum**

Add after the `PlayerVersion` enum (around line 1109):

```prisma
enum BallGrade {
  PRO_MATCH
  COMPETITION
  LEAGUE
  TRAINING
  CLUB
  MINI_SKILLS
}
```

- [ ] **Step 2: Update ProductCategory enum — add COLLECTIBLES**

```prisma
enum ProductCategory {
  JERSEYS
  BOOTS
  FOOTBALLS
  TRADING_CARDS
  STICKERS
  GOALKEEPER_GLOVES
  SHIN_GUARDS
  TRAINING_EQUIPMENT
  ACCESSORIES
  COLLECTIBLES
}
```

- [ ] **Step 3: Update ProductSubcategory enum — add STICKERS and TRADING_CARDS**

Add to the existing ProductSubcategory enum:

```prisma
  // Collectibles
  STICKERS
  TRADING_CARDS
```

- [ ] **Step 4: Update ProductCondition enum — add collector grades**

```prisma
enum ProductCondition {
  BRAND_NEW
  NEW_WITH_TAGS
  NEW_WITHOUT_TAGS
  USED_LIKE_NEW
  USED_GOOD
  USED_FAIR
  MINT
  NEAR_MINT
  EXCELLENT
  GOOD
  FAIR
  POOR
}
```

- [ ] **Step 5: Add nullable fields to Product model**

Add after the existing `playerVersion` field:

```prisma
  // Collectible fields (COLLECTIBLES category only)
  collectibleCode       String?
  setName               String?
  collectiblePublisher  String?
  collectiblePlayerName String?
  collectibleTeam       String?
  isPeeled              Boolean?

  // Football fields (FOOTBALLS category only)
  ballSize              Int?
  ballGrade             BallGrade?
```

- [ ] **Step 6: Generate and run the additive migration**

```bash
cd /Users/ayoola/mdfld-web
npx prisma migrate dev --name collectibles_football_schema
```

Expected: migration created and applied, no errors.

- [ ] **Step 7: Run the data migration — move existing STICKERS and TRADING_CARDS products**

```bash
npx prisma db execute --stdin <<'SQL'
UPDATE "product"
SET "category" = 'COLLECTIBLES', "subcategory" = 'STICKERS'
WHERE "category" = 'STICKERS';

UPDATE "product"
SET "category" = 'COLLECTIBLES', "subcategory" = 'TRADING_CARDS'
WHERE "category" = 'TRADING_CARDS';
SQL
```

- [ ] **Step 8: Verify data migration — confirm zero rows remain with old values**

```bash
npx prisma db execute --stdin <<'SQL'
SELECT COUNT(*) FROM "product" WHERE "category" IN ('STICKERS', 'TRADING_CARDS');
SQL
```

Expected output: `count = 0`

- [ ] **Step 9: Remove STICKERS and TRADING_CARDS from ProductCategory via raw SQL migration**

Create the file manually (replace `<timestamp>` with actual timestamp, e.g. `20260701000002`):

```bash
mkdir -p prisma/migrations/20260701000002_remove_old_category_values
```

Write `prisma/migrations/20260701000002_remove_old_category_values/migration.sql`:

```sql
-- Remove STICKERS and TRADING_CARDS from ProductCategory enum
-- Step 1: create replacement enum without the old values
CREATE TYPE "ProductCategory_new" AS ENUM (
  'JERSEYS',
  'BOOTS',
  'FOOTBALLS',
  'GOALKEEPER_GLOVES',
  'SHIN_GUARDS',
  'TRAINING_EQUIPMENT',
  'ACCESSORIES',
  'COLLECTIBLES'
);

-- Step 2: migrate the column
ALTER TABLE "product"
  ALTER COLUMN "category" TYPE "ProductCategory_new"
  USING "category"::text::"ProductCategory_new";

-- Step 3: swap names
DROP TYPE "ProductCategory";
ALTER TYPE "ProductCategory_new" RENAME TO "ProductCategory";
```

Apply it:

```bash
npx prisma migrate deploy
```

- [ ] **Step 10: Update schema.prisma ProductCategory to match (remove STICKERS and TRADING_CARDS)**

```prisma
enum ProductCategory {
  JERSEYS
  BOOTS
  FOOTBALLS
  GOALKEEPER_GLOVES
  SHIN_GUARDS
  TRAINING_EQUIPMENT
  ACCESSORIES
  COLLECTIBLES
}
```

- [ ] **Step 11: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 12: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "team/app.tsx"
```

Expected: no output (no new errors).

- [ ] **Step 13: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add COLLECTIBLES category, BallGrade enum, collectible/football fields to Product schema"
```

---

## Task 2: Category Constants and getCategoryGroup Helper

**Files:**
- Modify: `lib/constants/product-categories.ts`
- Create: `__tests__/lib/product-categories.test.ts`

**Interfaces:**
- Produces:
  - `getCategoryGroup(category: string): 'WEARABLE' | 'COLLECTIBLE' | 'FOOTBALL'`
  - `WEARABLE_CONDITIONS: { key: string; label: string }[]`
  - `COLLECTIBLE_CONDITIONS: { key: string; label: string }[]`
  - `FOOTBALL_CONDITIONS: { key: string; label: string }[]`
  - `BALL_GRADES: { key: string; label: string }[]`
  - `BALL_SIZE_LABELS: Record<number, string>`
  - `COLLECTIBLE_SUBCATEGORIES: { key: string; label: string }[]`
  - `FOOTBALL_CONDITION_LABELS: Record<string, string>`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/product-categories.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  getCategoryGroup,
  WEARABLE_CONDITIONS,
  COLLECTIBLE_CONDITIONS,
  FOOTBALL_CONDITIONS,
  BALL_GRADES,
  BALL_SIZE_LABELS,
  COLLECTIBLE_SUBCATEGORIES,
  FOOTBALL_CONDITION_LABELS,
} from '@/lib/constants/product-categories';

describe('getCategoryGroup', () => {
  it('returns WEARABLE for JERSEYS', () => {
    expect(getCategoryGroup('JERSEYS')).toBe('WEARABLE');
  });
  it('returns WEARABLE for BOOTS', () => {
    expect(getCategoryGroup('BOOTS')).toBe('WEARABLE');
  });
  it('returns WEARABLE for GOALKEEPER_GLOVES', () => {
    expect(getCategoryGroup('GOALKEEPER_GLOVES')).toBe('WEARABLE');
  });
  it('returns WEARABLE for SHIN_GUARDS', () => {
    expect(getCategoryGroup('SHIN_GUARDS')).toBe('WEARABLE');
  });
  it('returns WEARABLE for TRAINING_EQUIPMENT', () => {
    expect(getCategoryGroup('TRAINING_EQUIPMENT')).toBe('WEARABLE');
  });
  it('returns WEARABLE for ACCESSORIES', () => {
    expect(getCategoryGroup('ACCESSORIES')).toBe('WEARABLE');
  });
  it('returns COLLECTIBLE for COLLECTIBLES', () => {
    expect(getCategoryGroup('COLLECTIBLES')).toBe('COLLECTIBLE');
  });
  it('returns FOOTBALL for FOOTBALLS', () => {
    expect(getCategoryGroup('FOOTBALLS')).toBe('FOOTBALL');
  });
  it('defaults to WEARABLE for unknown category', () => {
    expect(getCategoryGroup('UNKNOWN')).toBe('WEARABLE');
  });
});

describe('condition constants', () => {
  it('WEARABLE_CONDITIONS includes BRAND_NEW', () => {
    expect(WEARABLE_CONDITIONS.map(c => c.key)).toContain('BRAND_NEW');
  });
  it('COLLECTIBLE_CONDITIONS includes MINT and POOR', () => {
    const keys = COLLECTIBLE_CONDITIONS.map(c => c.key);
    expect(keys).toContain('MINT');
    expect(keys).toContain('POOR');
  });
  it('FOOTBALL_CONDITIONS labels BRAND_NEW as New in Box', () => {
    const match = FOOTBALL_CONDITIONS.find(c => c.key === 'BRAND_NEW');
    expect(match?.label).toBe('New in Box');
  });
  it('FOOTBALL_CONDITION_LABELS maps BRAND_NEW to New in Box', () => {
    expect(FOOTBALL_CONDITION_LABELS['BRAND_NEW']).toBe('New in Box');
  });
});

describe('ball constants', () => {
  it('BALL_GRADES has 6 entries', () => {
    expect(BALL_GRADES).toHaveLength(6);
  });
  it('BALL_SIZE_LABELS covers sizes 1 through 5', () => {
    expect(Object.keys(BALL_SIZE_LABELS).map(Number).sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it('size 5 label mentions Professional', () => {
    expect(BALL_SIZE_LABELS[5]).toContain('Professional');
  });
});

describe('collectible constants', () => {
  it('COLLECTIBLE_SUBCATEGORIES includes STICKERS and TRADING_CARDS', () => {
    const keys = COLLECTIBLE_SUBCATEGORIES.map(s => s.key);
    expect(keys).toContain('STICKERS');
    expect(keys).toContain('TRADING_CARDS');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run __tests__/lib/product-categories.test.ts
```

Expected: FAIL — imports not found.

- [ ] **Step 3: Add constants and helper to lib/constants/product-categories.ts**

Add at the end of the existing file:

```ts
export const CATEGORY_GROUPS = {
  WEARABLE: ['JERSEYS', 'BOOTS', 'GOALKEEPER_GLOVES', 'SHIN_GUARDS', 'TRAINING_EQUIPMENT', 'ACCESSORIES'],
  COLLECTIBLE: ['COLLECTIBLES'],
  FOOTBALL: ['FOOTBALLS'],
} as const;

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;

export function getCategoryGroup(category: string): CategoryGroup {
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if ((cats as readonly string[]).includes(category)) return group as CategoryGroup;
  }
  return 'WEARABLE';
}

export const WEARABLE_CONDITIONS = [
  { key: 'BRAND_NEW', label: 'Brand New' },
  { key: 'NEW_WITH_TAGS', label: 'New with Tags' },
  { key: 'NEW_WITHOUT_TAGS', label: 'New without Tags' },
  { key: 'USED_LIKE_NEW', label: 'Used - Like New' },
  { key: 'USED_GOOD', label: 'Used - Good' },
  { key: 'USED_FAIR', label: 'Used - Fair' },
];

export const COLLECTIBLE_CONDITIONS = [
  { key: 'MINT', label: 'Mint' },
  { key: 'NEAR_MINT', label: 'Near Mint' },
  { key: 'EXCELLENT', label: 'Excellent' },
  { key: 'GOOD', label: 'Good' },
  { key: 'FAIR', label: 'Fair' },
  { key: 'POOR', label: 'Poor' },
];

export const FOOTBALL_CONDITION_LABELS: Record<string, string> = {
  BRAND_NEW: 'New in Box',
  NEW_WITHOUT_TAGS: 'New Without Box',
  USED_LIKE_NEW: 'Used - Like New',
  USED_GOOD: 'Used - Good',
  USED_FAIR: 'Used - Fair',
};

export const FOOTBALL_CONDITIONS = [
  { key: 'BRAND_NEW', label: 'New in Box' },
  { key: 'NEW_WITHOUT_TAGS', label: 'New Without Box' },
  { key: 'USED_LIKE_NEW', label: 'Used - Like New' },
  { key: 'USED_GOOD', label: 'Used - Good' },
  { key: 'USED_FAIR', label: 'Used - Fair' },
];

export const BALL_GRADES = [
  { key: 'PRO_MATCH', label: 'Pro / Match' },
  { key: 'COMPETITION', label: 'Competition' },
  { key: 'LEAGUE', label: 'League' },
  { key: 'TRAINING', label: 'Training' },
  { key: 'CLUB', label: 'Club' },
  { key: 'MINI_SKILLS', label: 'Mini / Skills' },
];

export const BALL_SIZE_LABELS: Record<number, string> = {
  1: 'Mini / Skills / Promo',
  2: 'Skills / Ages 3-5',
  3: 'Youth / Ages 5-8',
  4: 'Youth / Ages 8-12',
  5: 'Full size / Ages 13+ / Professional',
};

export const COLLECTIBLE_SUBCATEGORIES = [
  { key: 'STICKERS', label: 'Stickers' },
  { key: 'TRADING_CARDS', label: 'Trading Cards' },
];
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run __tests__/lib/product-categories.test.ts
```

Expected: all 15 tests PASS.

- [ ] **Step 5: Run full suite to confirm no regressions**

```bash
npx vitest run
```

Expected: all previously passing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add lib/constants/product-categories.ts __tests__/lib/product-categories.test.ts
git commit -m "feat: add CATEGORY_GROUPS, getCategoryGroup helper, and condition/grade/size constants"
```

---

## Task 3: tRPC — Extend create and update procedures

**Files:**
- Modify: `server/routers/product.ts`
- Create: `__tests__/server/routers/product-collectible.test.ts`

**Interfaces:**
- Consumes: `BallGrade` from `@prisma/client`
- Produces: `product.create` and `product.update` accept `collectibleCode`, `setName`, `collectiblePublisher`, `collectiblePlayerName`, `collectibleTeam`, `isPeeled`, `ballSize`, `ballGrade`, `subcategory`

- [ ] **Step 1: Write failing tests**

Create `__tests__/server/routers/product-collectible.test.ts`:

```ts
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

describe('product.create — collectible fields', () => {
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

describe('product.search — collectible filters', () => {
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run __tests__/server/routers/product-collectible.test.ts
```

Expected: FAIL — fields not accepted by schema.

- [ ] **Step 3: Extend createProductSchema in server/routers/product.ts**

Add to the existing `createProductSchema` z.object (after `tradeEnabled`):

```ts
  // Collectible fields
  subcategory: z.string().optional(),
  collectibleCode: z.string().optional(),
  setName: z.string().optional(),
  collectiblePublisher: z.string().optional(),
  collectiblePlayerName: z.string().optional(),
  collectibleTeam: z.string().optional(),
  isPeeled: z.boolean().optional(),

  // Football fields
  ballSize: z.number().int().min(1).max(5).optional(),
  ballGrade: z.nativeEnum(BallGrade).optional(),
```

Also add `BallGrade` to the import from `@prisma/client` at the top of the file.

- [ ] **Step 4: Pass new fields through in the create mutation**

In the `prisma.product.create({ data: { ... } })` call (around line 117), add:

```ts
subcategory: input.subcategory as any,
collectibleCode: input.collectibleCode,
setName: input.setName,
collectiblePublisher: input.collectiblePublisher,
collectiblePlayerName: input.collectiblePlayerName,
collectibleTeam: input.collectibleTeam,
isPeeled: input.isPeeled,
ballSize: input.ballSize,
ballGrade: input.ballGrade,
```

Also pass them through in the `update` mutation's `prisma.product.update({ data: { ... } })` call (the schema already uses `createProductSchema.partial()` so Zod accepts them automatically — just add the same fields to the data object).

- [ ] **Step 5: Extend the search procedure input schema**

In the `search` procedure's `z.object({...})`, add:

```ts
subcategory: z.string().optional(),
collectibleCode: z.string().optional(),
setName: z.string().optional(),
collectiblePublisher: z.string().optional(),
collectiblePlayerName: z.string().optional(),
collectibleTeam: z.string().optional(),
isPeeled: z.boolean().optional(),
ballSize: z.number().int().min(1).max(5).optional(),
ballGrade: z.nativeEnum(BallGrade).optional(),
```

- [ ] **Step 6: Wire new search filters into the where clause**

In the search procedure query body, after the existing `if (input.category)` block, add:

```ts
if (input.subcategory) {
  where.subcategory = input.subcategory as any;
}
if (input.collectibleCode) {
  where.collectibleCode = { contains: input.collectibleCode, mode: 'insensitive' };
}
if (input.setName) {
  where.setName = { contains: input.setName, mode: 'insensitive' };
}
if (input.collectiblePublisher) {
  where.collectiblePublisher = { contains: input.collectiblePublisher, mode: 'insensitive' };
}
if (input.collectiblePlayerName) {
  where.collectiblePlayerName = { contains: input.collectiblePlayerName, mode: 'insensitive' };
}
if (input.collectibleTeam) {
  where.collectibleTeam = { contains: input.collectibleTeam, mode: 'insensitive' };
}
if (input.isPeeled !== undefined) {
  where.isPeeled = input.isPeeled;
}
if (input.ballSize !== undefined) {
  where.ballSize = input.ballSize;
}
if (input.ballGrade) {
  where.ballGrade = input.ballGrade;
}
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
npx vitest run __tests__/server/routers/product-collectible.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 8: Run full suite**

```bash
npx vitest run
```

Expected: all previously passing tests still pass.

- [ ] **Step 9: Commit**

```bash
git add server/routers/product.ts __tests__/server/routers/product-collectible.test.ts
git commit -m "feat: extend product create and search tRPC procedures with collectible and football fields"
```

---

## Task 4: Upload Wizard — Category-Aware Form

**Files:**
- Modify: `components/dashboard/organizations/products/create/product-creation.tsx`
- Modify: `components/dashboard/organizations/products/create/product-basic-form.tsx`
- Modify: `components/dashboard/organizations/products/create/product-details-form.tsx` (add collectible/football section)

No new tests — this is UI wiring. Verify manually by opening the create listing flow.

**Interfaces:**
- Consumes: `getCategoryGroup`, `WEARABLE_CONDITIONS`, `COLLECTIBLE_CONDITIONS`, `FOOTBALL_CONDITIONS`, `BALL_GRADES`, `BALL_SIZE_LABELS`, `COLLECTIBLE_SUBCATEGORIES` from `@/lib/constants/product-categories`

- [ ] **Step 1: Extend ProductFormData in product-creation.tsx**

Add new fields to the `ProductFormData` interface:

```ts
export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  condition: string;
  images: string[];
  price: number;
  quantity: number;
  sku: string;
  brand: string;
  model: string;
  size: string;
  color: string;
  material: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  tags: string[];
  shippingTerms: 'CALCULATED' | 'INCLUDED_DDP';
  shippingCarrier: string;
  estimatedDeliveryDays: number;
  shipsFromCountry: string;
  tradeEnabled: boolean;
  // Collectible fields
  collectibleCode?: string;
  setName?: string;
  collectiblePublisher?: string;
  collectiblePlayerName?: string;
  collectibleTeam?: string;
  isPeeled?: boolean;
  // Football fields
  ballSize?: number;
  ballGrade?: string;
}
```

- [ ] **Step 2: Pass new fields in the handleSubmit mutation call in product-creation.tsx**

In the `createProduct.mutateAsync({...})` call, add:

```ts
subcategory: formData.subcategory || undefined,
collectibleCode: formData.collectibleCode || undefined,
setName: formData.setName || undefined,
collectiblePublisher: formData.collectiblePublisher || undefined,
collectiblePlayerName: formData.collectiblePlayerName || undefined,
collectibleTeam: formData.collectibleTeam || undefined,
isPeeled: formData.isPeeled,
ballSize: formData.ballSize,
ballGrade: formData.ballGrade as any || undefined,
```

- [ ] **Step 3: Update product-basic-form.tsx — replace hardcoded arrays with constants**

Replace the top of the file's `categories` and `conditions` arrays with imports and dynamic logic:

```tsx
'use client';

import type { InputProps } from '@heroui/react';
import React from 'react';
import { Input, Textarea, Select, SelectItem, Switch } from '@heroui/react';
import { ProductFormData } from './product-creation';
import ProductImageUpload from './product-image-upload';
import {
  getCategoryGroup,
  WEARABLE_CONDITIONS,
  COLLECTIBLE_CONDITIONS,
  FOOTBALL_CONDITIONS,
  COLLECTIBLE_SUBCATEGORIES,
  BALL_GRADES,
  BALL_SIZE_LABELS,
} from '@/lib/constants/product-categories';

const categories = [
  { key: 'JERSEYS', label: 'Jerseys' },
  { key: 'BOOTS', label: 'Boots' },
  { key: 'COLLECTIBLES', label: 'Collectibles' },
  { key: 'FOOTBALLS', label: 'Footballs' },
  { key: 'GOALKEEPER_GLOVES', label: 'Goalkeeper Gloves' },
  { key: 'SHIN_GUARDS', label: 'Shin Guards' },
  { key: 'TRAINING_EQUIPMENT', label: 'Training Equipment' },
  { key: 'ACCESSORIES', label: 'Accessories' },
];
```

- [ ] **Step 4: Make condition options category-aware in product-basic-form.tsx**

In the component body, derive conditions from the selected category:

```tsx
const categoryGroup = getCategoryGroup(data.category || '');

const conditions =
  categoryGroup === 'COLLECTIBLE'
    ? COLLECTIBLE_CONDITIONS
    : categoryGroup === 'FOOTBALL'
    ? FOOTBALL_CONDITIONS
    : WEARABLE_CONDITIONS;
```

Update the condition `<Select>` to use `conditions` instead of the hardcoded array (change `condition.key` to `condition.key` and `condition.label` to `condition.label` — same shape, now dynamic).

- [ ] **Step 5: Add subcategory field for COLLECTIBLES in product-basic-form.tsx**

After the category `<Select>` and before the condition `<Select>`, insert:

```tsx
{categoryGroup === 'COLLECTIBLE' && (
  <Select
    className="col-span-12"
    label="Type"
    placeholder="Stickers or Trading Cards"
    selectedKeys={data.subcategory ? [data.subcategory] : []}
    onSelectionChange={(keys) => {
      const selected = Array.from(keys)[0] as string;
      onUpdate({ subcategory: selected });
    }}
    isRequired
    labelPlacement="outside"
    classNames={{ label: 'text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700' }}
  >
    {COLLECTIBLE_SUBCATEGORIES.map((s) => (
      <SelectItem key={s.key}>{s.label}</SelectItem>
    ))}
  </Select>
)}
```

- [ ] **Step 6: Add collectible-specific fields section in product-details-form.tsx**

Open `components/dashboard/organizations/products/create/product-details-form.tsx`. Add the import at the top:

```tsx
import {
  getCategoryGroup,
  BALL_GRADES,
  BALL_SIZE_LABELS,
} from '@/lib/constants/product-categories';
```

Add props to accept and update the new fields — the component already receives `data: Partial<ProductFormData>` and `onUpdate`. Derive the group:

```tsx
const categoryGroup = getCategoryGroup(data.category || '');
```

At the end of the form (after existing fields, before the closing tag), add:

```tsx
{/* Collectible fields */}
{categoryGroup === 'COLLECTIBLE' && (
  <>
    <Input
      className="col-span-12 md:col-span-6"
      label="Code"
      placeholder="e.g. KOR14"
      value={data.collectibleCode || ''}
      onValueChange={(v) => onUpdate({ collectibleCode: v })}
      {...inputProps}
    />
    <Input
      className="col-span-12 md:col-span-6"
      label="Set / Series"
      placeholder="e.g. FIFA World Cup 2026"
      value={data.setName || ''}
      onValueChange={(v) => onUpdate({ setName: v })}
      {...inputProps}
    />
    <Input
      className="col-span-12 md:col-span-6"
      label="Publisher"
      placeholder="e.g. Panini"
      value={data.collectiblePublisher || ''}
      onValueChange={(v) => onUpdate({ collectiblePublisher: v })}
      {...inputProps}
    />
    <Input
      className="col-span-12 md:col-span-6"
      label="Player"
      placeholder="e.g. Son Heung-min"
      value={data.collectiblePlayerName || ''}
      onValueChange={(v) => onUpdate({ collectiblePlayerName: v })}
      {...inputProps}
    />
    <Input
      className="col-span-12 md:col-span-6"
      label="Team / Country"
      placeholder="e.g. South Korea"
      value={data.collectibleTeam || ''}
      onValueChange={(v) => onUpdate({ collectibleTeam: v })}
      {...inputProps}
    />
    {data.subcategory === 'STICKERS' && (
      <div className="col-span-12 flex items-center gap-3 py-2">
        <Switch
          isSelected={data.isPeeled ?? false}
          onValueChange={(v) => onUpdate({ isPeeled: v })}
        />
        <span className="text-small text-default-700">Peeled (previously stuck in album)</span>
      </div>
    )}
  </>
)}

{/* Football fields */}
{categoryGroup === 'FOOTBALL' && (
  <>
    <Select
      className="col-span-12 md:col-span-6"
      label="Ball Size"
      placeholder="Select size"
      selectedKeys={data.ballSize ? [String(data.ballSize)] : []}
      onSelectionChange={(keys) => {
        const v = Array.from(keys)[0] as string;
        onUpdate({ ballSize: Number(v) });
      }}
      {...inputProps}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <SelectItem key={String(n)}>
          {`Size ${n} - ${BALL_SIZE_LABELS[n]}`}
        </SelectItem>
      ))}
    </Select>
    <Select
      className="col-span-12 md:col-span-6"
      label="Ball Grade"
      placeholder="Select grade"
      selectedKeys={data.ballGrade ? [data.ballGrade] : []}
      onSelectionChange={(keys) => {
        const v = Array.from(keys)[0] as string;
        onUpdate({ ballGrade: v });
      }}
      {...inputProps}
    >
      {BALL_GRADES.map((g) => (
        <SelectItem key={g.key}>{g.label}</SelectItem>
      ))}
    </Select>
  </>
)}
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "team/app.tsx"
```

Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add components/dashboard/organizations/products/create/
git commit -m "feat: category-aware upload wizard - collectible and football fields"
```

---

## Task 5: Product Filters — Category-Aware Sidebar

**Files:**
- Modify: `components/product-filters.tsx`
- Modify: `app/(main)/products/products-page-client.tsx`

**Interfaces:**
- Consumes: `getCategoryGroup`, `COLLECTIBLE_CONDITIONS`, `FOOTBALL_CONDITIONS`, `BALL_GRADES`, `COLLECTIBLE_SUBCATEGORIES` from `@/lib/constants/product-categories`
- The `onFiltersChange` callback gains new fields: `subcategory`, `collectibleCode`, `setName`, `collectiblePublisher`, `collectiblePlayerName`, `collectibleTeam`, `isPeeled`, `ballSize`, `ballGrade`

- [ ] **Step 1: Add imports and update FOOTBALL_CATEGORIES in product-filters.tsx**

Replace the existing `FOOTBALL_CATEGORIES` constant and add imports:

```tsx
import {
  getCategoryGroup,
  WEARABLE_CONDITIONS,
  COLLECTIBLE_CONDITIONS,
  FOOTBALL_CONDITIONS,
  BALL_GRADES,
  COLLECTIBLE_SUBCATEGORIES,
} from '@/lib/constants/product-categories';

const FOOTBALL_CATEGORIES = [
  { value: 'JERSEYS', label: 'Jerseys' },
  { value: 'BOOTS', label: 'Boots' },
  { value: 'COLLECTIBLES', label: 'Collectibles' },
  { value: 'FOOTBALLS', label: 'Footballs' },
  { value: 'GOALKEEPER_GLOVES', label: 'Goalkeeper Gloves' },
  { value: 'SHIN_GUARDS', label: 'Shin Guards' },
  { value: 'TRAINING_EQUIPMENT', label: 'Training Equipment' },
  { value: 'ACCESSORIES', label: 'Accessories' },
];
```

- [ ] **Step 2: Extend the filters state in product-filters.tsx**

In the `useState` initialiser for `filters`, add:

```ts
const [filters, setFilters] = React.useState({
  categories: initialCategories || ([] as string[]),
  priceRange: [0, 5000] as [number, number],
  conditions: [] as string[],
  verificationStatuses: [] as string[],
  tradeEnabled: initialTradeEnabled ?? false,
  // new fields
  subcategory: '',
  collectibleCode: '',
  setName: '',
  collectiblePublisher: '',
  collectiblePlayerName: '',
  collectibleTeam: '',
  isPeeled: undefined as boolean | undefined,
  ballSize: undefined as number | undefined,
  ballGrade: '',
});
```

Also reset them in the reset handler:

```ts
subcategory: '',
collectibleCode: '',
setName: '',
collectiblePublisher: '',
collectiblePlayerName: '',
collectibleTeam: '',
isPeeled: undefined,
ballSize: undefined,
ballGrade: '',
```

- [ ] **Step 3: Derive active category group in product-filters.tsx**

In the component body (after state declaration):

```ts
const activeCategory = filters.categories[0] ?? '';
const categoryGroup = getCategoryGroup(activeCategory);

const activeConditions =
  categoryGroup === 'COLLECTIBLE'
    ? COLLECTIBLE_CONDITIONS
    : categoryGroup === 'FOOTBALL'
    ? FOOTBALL_CONDITIONS
    : WEARABLE_CONDITIONS;
```

- [ ] **Step 4: Replace hardcoded CONDITIONS with activeConditions in the condition accordion section**

Find the condition CheckboxGroup and change `{CONDITIONS.map(...)}` to `{activeConditions.map(...)}`.

- [ ] **Step 5: Add collectible filter accordion section**

After the existing verification status accordion item, insert:

```tsx
{categoryGroup === 'COLLECTIBLE' && (
  <AccordionItem key="collectible-type" title="Type">
    <CheckboxGroup
      value={filters.subcategory ? [filters.subcategory] : []}
      onValueChange={(v) => updateFilter('subcategory', v[0] ?? '')}
    >
      {COLLECTIBLE_SUBCATEGORIES.map((s) => (
        <Checkbox key={s.key} value={s.key}>{s.label}</Checkbox>
      ))}
    </CheckboxGroup>
  </AccordionItem>
)}

{categoryGroup === 'COLLECTIBLE' && (
  <AccordionItem key="collectible-details" title="Details">
    <div className="flex flex-col gap-3">
      <Input
        size="sm"
        label="Code"
        placeholder="e.g. KOR14"
        value={filters.collectibleCode}
        onValueChange={(v) => updateFilter('collectibleCode', v)}
      />
      <Input
        size="sm"
        label="Set / Series"
        placeholder="e.g. FIFA World Cup 2026"
        value={filters.setName}
        onValueChange={(v) => updateFilter('setName', v)}
      />
      <Input
        size="sm"
        label="Publisher"
        placeholder="e.g. Panini"
        value={filters.collectiblePublisher}
        onValueChange={(v) => updateFilter('collectiblePublisher', v)}
      />
      <Input
        size="sm"
        label="Player"
        placeholder="e.g. Son Heung-min"
        value={filters.collectiblePlayerName}
        onValueChange={(v) => updateFilter('collectiblePlayerName', v)}
      />
      <Input
        size="sm"
        label="Team / Country"
        placeholder="e.g. South Korea"
        value={filters.collectibleTeam}
        onValueChange={(v) => updateFilter('collectibleTeam', v)}
      />
      {filters.subcategory === 'STICKERS' && (
        <div className="flex items-center gap-2">
          <Switch
            size="sm"
            isSelected={filters.isPeeled ?? false}
            onValueChange={(v) => updateFilter('isPeeled', v)}
          />
          <span className="text-small text-default-500">Peeled only</span>
        </div>
      )}
    </div>
  </AccordionItem>
)}
```

- [ ] **Step 6: Add football filter accordion section**

After the collectible section, insert:

```tsx
{categoryGroup === 'FOOTBALL' && (
  <AccordionItem key="football-size" title="Ball Size">
    <CheckboxGroup
      value={filters.ballSize !== undefined ? [String(filters.ballSize)] : []}
      onValueChange={(v) => updateFilter('ballSize', v.length > 0 ? Number(v[v.length - 1]) : undefined)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Checkbox key={String(n)} value={String(n)}>Size {n}</Checkbox>
      ))}
    </CheckboxGroup>
  </AccordionItem>
)}

{categoryGroup === 'FOOTBALL' && (
  <AccordionItem key="football-grade" title="Ball Grade">
    <CheckboxGroup
      value={filters.ballGrade ? [filters.ballGrade] : []}
      onValueChange={(v) => updateFilter('ballGrade', v[0] ?? '')}
    >
      {BALL_GRADES.map((g) => (
        <Checkbox key={g.key} value={g.key}>{g.label}</Checkbox>
      ))}
    </CheckboxGroup>
  </AccordionItem>
)}
```

- [ ] **Step 7: Pass new filter fields through onFiltersChange**

In the `updateFilter` function (or wherever `onFiltersChange` is called), ensure all new fields are included:

```ts
onFiltersChange?.({
  categories: newFilters.categories,
  priceRange: newFilters.priceRange,
  conditions: newFilters.conditions,
  verificationStatuses: newFilters.verificationStatuses,
  tradeEnabled: newFilters.tradeEnabled,
  subcategory: newFilters.subcategory,
  collectibleCode: newFilters.collectibleCode,
  setName: newFilters.setName,
  collectiblePublisher: newFilters.collectiblePublisher,
  collectiblePlayerName: newFilters.collectiblePlayerName,
  collectibleTeam: newFilters.collectibleTeam,
  isPeeled: newFilters.isPeeled,
  ballSize: newFilters.ballSize,
  ballGrade: newFilters.ballGrade,
});
```

- [ ] **Step 8: Wire new filter state into the search query in products-page-client.tsx**

Extend the state in `products-page-client.tsx`:

```ts
const [collectibleFilters, setCollectibleFilters] = React.useState<{
  subcategory?: string;
  collectibleCode?: string;
  setName?: string;
  collectiblePublisher?: string;
  collectiblePlayerName?: string;
  collectibleTeam?: string;
  isPeeled?: boolean;
  ballSize?: number;
  ballGrade?: string;
}>({});
```

Update the `onFiltersChange` handler to capture them:

```ts
onFiltersChange={(filters) => {
  if (filters.categories) setSelectedCategories(filters.categories);
  if (filters.priceRange) setPriceRange(filters.priceRange);
  if (filters.conditions) setSelectedConditions(filters.conditions);
  if (filters.verificationStatuses) setSelectedVerificationStatuses(filters.verificationStatuses);
  setTradeEnabled(filters.tradeEnabled ?? false);
  setCollectibleFilters({
    subcategory: filters.subcategory || undefined,
    collectibleCode: filters.collectibleCode || undefined,
    setName: filters.setName || undefined,
    collectiblePublisher: filters.collectiblePublisher || undefined,
    collectiblePlayerName: filters.collectiblePlayerName || undefined,
    collectibleTeam: filters.collectibleTeam || undefined,
    isPeeled: filters.isPeeled,
    ballSize: filters.ballSize,
    ballGrade: filters.ballGrade || undefined,
  });
}}
```

Pass them into the search query:

```ts
trpc.product.search.useInfiniteQuery(
  {
    limit: 20,
    query: urlQuery,
    category: selectedCategories.length > 0 ? selectedCategories[0] : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
    tradeEnabled: tradeEnabled || undefined,
    verificationStatuses: (selectedVerificationStatuses.length > 0 ? selectedVerificationStatuses : undefined) as any,
    ...collectibleFilters,
  },
  { getNextPageParam: (lastPage: any) => lastPage.nextCursor }
)
```

- [ ] **Step 9: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "team/app.tsx"
```

Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add components/product-filters.tsx app/\(main\)/products/products-page-client.tsx
git commit -m "feat: category-aware product filters for collectibles and footballs"
```

---

## Task 6: Product Detail Page — Category-Aware Display

**Files:**
- Modify: `app/(main)/products/[product]/page.tsx`

**Interfaces:**
- Consumes: `getCategoryGroup`, `FOOTBALL_CONDITION_LABELS`, `BALL_SIZE_LABELS`, `BALL_GRADES` from `@/lib/constants/product-categories`

- [ ] **Step 1: Add imports in the product detail page**

```tsx
import {
  getCategoryGroup,
  FOOTBALL_CONDITION_LABELS,
  BALL_SIZE_LABELS,
  BALL_GRADES,
} from '@/lib/constants/product-categories';
```

- [ ] **Step 2: Derive category group and build attribute list**

Find the section that builds the attributes array (around line 129–143). Replace the static attribute building with category-aware logic:

```tsx
const categoryGroup = getCategoryGroup(p.category);

const conditionLabel =
  categoryGroup === 'FOOTBALL'
    ? (FOOTBALL_CONDITION_LABELS[p.condition] ?? p.condition.replace(/_/g, ' ').toLowerCase())
    : p.condition?.replace(/_/g, ' ').toLowerCase() ?? 'New';

const attributes: string[] = [
  `Category: ${p.category.replace(/_/g, ' ').toLowerCase()}`,
  `Condition: ${conditionLabel}`,
  `Brand: ${p.brand || 'Generic'}`,
];

if (categoryGroup === 'COLLECTIBLE') {
  if (p.setName) attributes.push(`Set: ${p.setName}`);
  if (p.collectibleCode) attributes.push(`Code: ${p.collectibleCode}`);
  if (p.collectiblePublisher) attributes.push(`Publisher: ${p.collectiblePublisher}`);
  if (p.collectiblePlayerName) attributes.push(`Player: ${p.collectiblePlayerName}`);
  if (p.collectibleTeam) attributes.push(`Team: ${p.collectibleTeam}`);
} else if (categoryGroup === 'FOOTBALL') {
  if (p.ballSize) attributes.push(`Size: ${p.ballSize} - ${BALL_SIZE_LABELS[p.ballSize]}`);
  if (p.ballGrade) {
    const gradeLabel = BALL_GRADES.find(g => g.key === p.ballGrade)?.label ?? p.ballGrade;
    attributes.push(`Grade: ${gradeLabel}`);
  }
} else {
  // Wearable-specific attributes
  if (p.tier) attributes.push(`Tier: ${p.tier}`);
  if (p.year) attributes.push(`Year: ${p.year}`);
  if (p.season) attributes.push(`Season: ${p.season}`);
}
```

- [ ] **Step 3: Add Peeled badge for stickers**

In the JSX where the product title/badges render, after the verification badge block, add:

```tsx
{categoryGroup === 'COLLECTIBLE' && (p as any).isPeeled && (
  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
    Peeled
  </span>
)}
```

- [ ] **Step 4: Ensure Prisma select includes new fields**

Find the `prisma.product.findUnique` (or `findFirst`) call in this page's data fetching. Confirm the select or include pulls the new fields. If it uses `select`, add:

```ts
collectibleCode: true,
setName: true,
collectiblePublisher: true,
collectiblePlayerName: true,
collectibleTeam: true,
isPeeled: true,
ballSize: true,
ballGrade: true,
subcategory: true,
```

If it fetches the full record (no select), this step is a no-op.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v "team/app.tsx"
```

Expected: no output.

- [ ] **Step 6: Run full suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/\(main\)/products/\[product\]/page.tsx
git commit -m "feat: category-aware product detail page - collectible and football attribute display"
```
