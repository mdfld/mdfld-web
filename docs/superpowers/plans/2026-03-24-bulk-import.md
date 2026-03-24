# Bulk Product Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bulk product import feature that lets sellers bring inventory from Shopify (API), eBay (API), Depop/Vinted/Wix/WooCommerce/GoDaddy (CSV export guides), and Instagram/WhatsApp/informal (MDFLD CSV template) into the seller dashboard.

**Architecture:** A dedicated import page at `/dashboard/organization/import` with a two-track layout (marketplace API/guides vs social/informal), a CSV drop zone, and a selection+review table. Backend routes handle CSV parsing, preview session storage, OAuth flows for Shopify/eBay, and a transactional confirm step that writes draft products to the DB.

**Tech Stack:** Next.js 15 App Router, Prisma 6 (PostgreSQL), better-auth, Zod 4, Vitest, HeroUI, Iconify (`solar:*`), TypeScript

**Spec:** `docs/superpowers/specs/2026-03-24-bulk-import-design.md`

---

## File Map

### New files
- `vitest.config.ts` — Vitest config
- `vitest.setup.ts` — Vitest setup (mock prisma)
- `__tests__/lib/import/normalise-size.test.ts`
- `__tests__/lib/import/normalise-category.test.ts`
- `__tests__/lib/import/normalise-condition.test.ts`
- `__tests__/lib/import/parse-csv.test.ts`
- `__tests__/api/products/bulk-import/parse.test.ts`
- `__tests__/api/products/bulk-import/confirm.test.ts`
- `__tests__/api/products/bulk-import/session.test.ts`
- `lib/import/normalise-size.ts` — size string → `{ sizeValue, sizeSystem, sizeDisplay }`
- `lib/import/normalise-category.ts` — source string → `ProductCategory | null`
- `lib/import/normalise-condition.ts` — source string → `ProductCondition`
- `lib/import/parse-csv.ts` — CSV text → validated preview rows
- `lib/import/types.ts` — shared `ImportRow` and `ImportRowStatus` types
- `app/api/products/bulk-import/parse/route.ts`
- `app/api/products/bulk-import/confirm/route.ts`
- `app/api/products/bulk-import/session/route.ts`
- `app/api/products/bulk-import/shopify/connect/route.ts`
- `app/api/products/bulk-import/shopify/callback/route.ts`
- `app/api/products/bulk-import/ebay/connect/route.ts`
- `app/api/products/bulk-import/ebay/callback/route.ts`
- `app/(dashboard)/dashboard/organization/import/page.tsx`
- `components/dashboard/organizations/import/platform-grid.tsx`
- `components/dashboard/organizations/import/social-track.tsx`
- `components/dashboard/organizations/import/csv-drop-zone.tsx`
- `components/dashboard/organizations/import/review-table.tsx`
- `components/dashboard/organizations/import/success-screen.tsx`
- `components/dashboard/organizations/import/guide-modal.tsx`

### Existing files to modify
- `prisma/schema.prisma` — add OAuth fields to `SellerProfile`, add `ImportSession` model
- `components/sidebar/dashboard/sidebar-items.tsx` — add Import nav item under Store section
- `components/dashboard/organizations/listings/app.tsx` — add Import button next to Add Product
- `app/api/products/bulk-import/template/route.ts` — already exists; verify and keep

---

## Task 0: Set up Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Install Vitest and test utilities**

```bash
cd /Users/ayoola/mdfld-web
npm install --save-dev vitest @vitest/coverage-v8 vite-tsconfig-paths
```

Expected: packages added to `devDependencies`

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
// Global test setup — nothing needed yet
```

- [ ] **Step 4: Add test script to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify Vitest is working**

Create `__tests__/smoke.test.ts`:
```ts
describe("smoke", () => {
  it("works", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: `1 passed`

Delete `__tests__/smoke.test.ts` after confirming.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts vitest.setup.ts package.json package-lock.json
git commit -m "chore: add vitest test setup"
```

---

## Task 1: Prisma Migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add OAuth fields to `SellerProfile` and the `ImportSession` model**

In `prisma/schema.prisma`, add to the `SellerProfile` model (after the existing Stripe fields):

```prisma
  // Shopify OAuth
  shopifyAccessToken    String?
  shopifyShopDomain     String?
  shopifyTokenExpiresAt DateTime?

  // eBay OAuth
  ebayAccessToken       String?
  ebayRefreshToken      String?
  ebayTokenExpiresAt    DateTime?

  importSessions        ImportSession[]
```

Add the new model at the end of the schema file (before the closing of the file):

```prisma
model ImportSession {
  id        String   @id @default(cuid())
  sellerId  String
  platform  String
  rows      Json
  expiresAt DateTime
  createdAt DateTime @default(now())

  seller SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([sellerId])
  @@map("import_session")
}
```

- [ ] **Step 2: Generate and run the migration**

```bash
npx prisma migrate dev --name add_import_oauth_and_session
```

Expected: Migration file created under `prisma/migrations/`, schema applied to local DB.

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: `@prisma/client` types updated — `SellerProfile` has the new fields, `ImportSession` model is queryable.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ImportSession model and OAuth token fields to SellerProfile"
```

---

## Task 2: Shared Import Types

**Files:**
- Create: `lib/import/types.ts`

- [ ] **Step 1: Create `lib/import/types.ts`**

```ts
import type { ProductCategory, ProductCondition, SizeSystem } from "@prisma/client";

export type ImportRowStatus = "ready" | "fix_size" | "skip";

export interface ImportRow {
  // Identity
  id: string; // cuid generated at parse time, used as React key

  // Product fields
  title: string;
  description: string; // fallback to title if blank
  price: number;
  compareAtPrice?: number;
  category: ProductCategory | null;
  brand?: string;
  condition: ProductCondition;
  images: string[];
  tags: string[];
  sku?: string;
  inventory: number;

  // Variant fields (undefined = no variants)
  hasVariants: boolean;
  sizeValue?: string;
  sizeSystem?: SizeSystem | null; // null = needs fix
  sizeDisplay?: string;
  variantPrice?: number;
  variantInventory?: number;
  variantSku?: string;
  variantColor?: string;

  // Review state
  status: ImportRowStatus;
  statusReason?: string;

  // Source
  sourcePlatform?: string;
  sourceThumbnail?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/import/types.ts
git commit -m "feat: add ImportRow shared type"
```

---

## Task 3: Size Normalisation Utility

**Files:**
- Create: `lib/import/normalise-size.ts`
- Create: `__tests__/lib/import/normalise-size.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/import/normalise-size.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normaliseSize } from "@/lib/import/normalise-size";

describe("normaliseSize", () => {
  it("parses 'UK 9'", () => {
    expect(normaliseSize("UK 9")).toEqual({ sizeValue: "9", sizeSystem: "UK", sizeDisplay: "UK 9" });
  });
  it("parses 'UK9' (no space)", () => {
    expect(normaliseSize("UK9")).toEqual({ sizeValue: "9", sizeSystem: "UK", sizeDisplay: "UK 9" });
  });
  it("parses 'US 10'", () => {
    expect(normaliseSize("US 10")).toEqual({ sizeValue: "10", sizeSystem: "US", sizeDisplay: "US 10" });
  });
  it("parses '10 US'", () => {
    expect(normaliseSize("10 US")).toEqual({ sizeValue: "10", sizeSystem: "US", sizeDisplay: "US 10" });
  });
  it("parses EU by numeric range (43)", () => {
    expect(normaliseSize("43")).toEqual({ sizeValue: "43", sizeSystem: "EU", sizeDisplay: "EU 43" });
  });
  it("parses 'EU 43'", () => {
    expect(normaliseSize("EU 43")).toEqual({ sizeValue: "43", sizeSystem: "EU", sizeDisplay: "EU 43" });
  });
  it("parses 'M' as STANDARD", () => {
    expect(normaliseSize("M")).toEqual({ sizeValue: "M", sizeSystem: "STANDARD", sizeDisplay: "STANDARD M" });
  });
  it("parses 'XL' as STANDARD", () => {
    expect(normaliseSize("XL")).toEqual({ sizeValue: "XL", sizeSystem: "STANDARD", sizeDisplay: "STANDARD XL" });
  });
  it("parses 'One Size'", () => {
    expect(normaliseSize("One Size")).toEqual({ sizeValue: "ONE_SIZE", sizeSystem: "ONE_SIZE", sizeDisplay: "ONE_SIZE ONE_SIZE" });
  });
  it("parses 'OS'", () => {
    expect(normaliseSize("OS")).toEqual({ sizeValue: "ONE_SIZE", sizeSystem: "ONE_SIZE", sizeDisplay: "ONE_SIZE ONE_SIZE" });
  });
  it("returns null for unrecognised string", () => {
    expect(normaliseSize("weird size XYZ")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(normaliseSize("")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify all fail**

```bash
npm test -- --reporter=verbose 2>&1 | head -30
```

Expected: `Cannot find module '@/lib/import/normalise-size'`

- [ ] **Step 3: Implement `lib/import/normalise-size.ts`**

```ts
import type { SizeSystem } from "@prisma/client";

interface SizeResult {
  sizeValue: string;
  sizeSystem: SizeSystem;
  sizeDisplay: string;
}

const STANDARD_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]);
const ONE_SIZE_LABELS = new Set(["ONE SIZE", "OS", "ONESIZE", "ONE-SIZE"]);

export function normaliseSize(raw: string): SizeResult | null {
  const s = raw.trim();
  if (!s) return null;
  const upper = s.toUpperCase();

  // One size
  if (ONE_SIZE_LABELS.has(upper)) {
    return { sizeValue: "ONE_SIZE", sizeSystem: "ONE_SIZE", sizeDisplay: "ONE_SIZE ONE_SIZE" };
  }

  // Standard apparel
  if (STANDARD_SIZES.has(upper)) {
    return { sizeValue: upper, sizeSystem: "STANDARD", sizeDisplay: `STANDARD ${upper}` };
  }

  // Explicit system prefix or suffix: "UK 9", "UK9", "9 UK", "US 10", "EU 43"
  const SYSTEMS: Array<{ system: SizeSystem; aliases: string[] }> = [
    { system: "UK", aliases: ["UK"] },
    { system: "US", aliases: ["US"] },
    { system: "EU", aliases: ["EU", "EUR"] },
    { system: "JP", aliases: ["JP", "JPN", "JAP"] },
    { system: "CM", aliases: ["CM"] },
  ];

  for (const { system, aliases } of SYSTEMS) {
    for (const alias of aliases) {
      // Prefix: "UK 9", "UK9"
      const prefixMatch = upper.match(new RegExp(`^${alias}\\s*([\\d.]+)$`));
      if (prefixMatch) {
        const val = prefixMatch[1];
        return { sizeValue: val, sizeSystem: system, sizeDisplay: `${system} ${val}` };
      }
      // Suffix: "9 UK", "9UK"
      const suffixMatch = upper.match(new RegExp(`^([\\d.]+)\\s*${alias}$`));
      if (suffixMatch) {
        const val = suffixMatch[1];
        return { sizeValue: val, sizeSystem: system, sizeDisplay: `${system} ${val}` };
      }
    }
  }

  // Bare numeric — infer EU for 35–50 range (footwear)
  const numericMatch = upper.match(/^[\d.]+$/);
  if (numericMatch) {
    const num = parseFloat(upper);
    if (num >= 35 && num <= 50) {
      return { sizeValue: upper, sizeSystem: "EU", sizeDisplay: `EU ${upper}` };
    }
  }

  return null;
}
```

- [ ] **Step 4: Run — verify all pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "PASS|FAIL|✓|✗"
```

Expected: all 12 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/import/normalise-size.ts __tests__/lib/import/normalise-size.test.ts
git commit -m "feat: add size normalisation utility with tests"
```

---

## Task 4: Category & Condition Mapping Utilities

**Files:**
- Create: `lib/import/normalise-category.ts`
- Create: `lib/import/normalise-condition.ts`
- Create: `__tests__/lib/import/normalise-category.test.ts`
- Create: `__tests__/lib/import/normalise-condition.test.ts`

- [ ] **Step 1: Write failing tests for category**

Create `__tests__/lib/import/normalise-category.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normaliseCategory } from "@/lib/import/normalise-category";

describe("normaliseCategory", () => {
  it("maps 'boot' → BOOTS", () => expect(normaliseCategory("boot")).toBe("BOOTS"));
  it("maps 'Football Boots' → BOOTS", () => expect(normaliseCategory("Football Boots")).toBe("BOOTS"));
  it("maps 'cleat' → BOOTS", () => expect(normaliseCategory("cleat")).toBe("BOOTS"));
  it("maps 'soccer cleat' → BOOTS", () => expect(normaliseCategory("soccer cleat")).toBe("BOOTS"));
  it("maps 'jersey' → JERSEYS", () => expect(normaliseCategory("jersey")).toBe("JERSEYS"));
  it("maps 'Football Kit' → JERSEYS", () => expect(normaliseCategory("Football Kit")).toBe("JERSEYS"));
  it("maps 'shirt' → JERSEYS", () => expect(normaliseCategory("shirt")).toBe("JERSEYS"));
  it("maps 'football' → FOOTBALLS", () => expect(normaliseCategory("football")).toBe("FOOTBALLS"));
  it("maps 'soccer ball' → FOOTBALLS", () => expect(normaliseCategory("soccer ball")).toBe("FOOTBALLS"));
  it("maps 'trading card' → TRADING_CARDS", () => expect(normaliseCategory("trading card")).toBe("TRADING_CARDS"));
  it("maps 'Panini' → TRADING_CARDS", () => expect(normaliseCategory("Panini")).toBe("TRADING_CARDS"));
  it("maps 'goalkeeper glove' → GOALKEEPER_GLOVES", () => expect(normaliseCategory("goalkeeper glove")).toBe("GOALKEEPER_GLOVES"));
  it("maps 'shin guard' → SHIN_GUARDS", () => expect(normaliseCategory("shin guard")).toBe("SHIN_GUARDS"));
  it("maps 'shin pad' → SHIN_GUARDS", () => expect(normaliseCategory("shin pad")).toBe("SHIN_GUARDS"));
  it("maps 'training' → TRAINING_EQUIPMENT", () => expect(normaliseCategory("training")).toBe("TRAINING_EQUIPMENT"));
  it("returns null for unrecognised", () => expect(normaliseCategory("random stuff")).toBeNull());
  it("returns null for empty string", () => expect(normaliseCategory("")).toBeNull());
});
```

- [ ] **Step 2: Write failing tests for condition**

Create `__tests__/lib/import/normalise-condition.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { normaliseCondition } from "@/lib/import/normalise-condition";

describe("normaliseCondition", () => {
  it("maps 'Brand new' → BRAND_NEW", () => expect(normaliseCondition("Brand new")).toBe("BRAND_NEW"));
  it("maps 'BNIB' → BRAND_NEW", () => expect(normaliseCondition("BNIB")).toBe("BRAND_NEW"));
  it("maps 'New with tags' → NEW_WITH_TAGS", () => expect(normaliseCondition("New with tags")).toBe("NEW_WITH_TAGS"));
  it("maps 'BNWT' → NEW_WITH_TAGS", () => expect(normaliseCondition("BNWT")).toBe("NEW_WITH_TAGS"));
  it("maps 'New without tags' → NEW_WITHOUT_TAGS", () => expect(normaliseCondition("New without tags")).toBe("NEW_WITHOUT_TAGS"));
  it("maps 'BNWOB' → NEW_WITHOUT_TAGS", () => expect(normaliseCondition("BNWOB")).toBe("NEW_WITHOUT_TAGS"));
  it("maps 'Like new' → USED_LIKE_NEW", () => expect(normaliseCondition("Like new")).toBe("USED_LIKE_NEW"));
  it("maps 'Excellent' → USED_LIKE_NEW", () => expect(normaliseCondition("Excellent")).toBe("USED_LIKE_NEW"));
  it("maps 'Good' → USED_GOOD", () => expect(normaliseCondition("Good")).toBe("USED_GOOD"));
  it("maps 'Very good' → USED_GOOD", () => expect(normaliseCondition("Very good")).toBe("USED_GOOD"));
  it("maps 'Fair' → USED_FAIR", () => expect(normaliseCondition("Fair")).toBe("USED_FAIR"));
  it("maps 'Acceptable' → USED_FAIR", () => expect(normaliseCondition("Acceptable")).toBe("USED_FAIR"));
  it("defaults unknown → USED_GOOD", () => expect(normaliseCondition("whatever")).toBe("USED_GOOD"));
  it("defaults empty → USED_GOOD", () => expect(normaliseCondition("")).toBe("USED_GOOD"));
});
```

- [ ] **Step 3: Run — verify both fail**

```bash
npm test -- --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module` for both utilities

- [ ] **Step 4: Implement `lib/import/normalise-category.ts`**

```ts
import type { ProductCategory } from "@prisma/client";

const RULES: Array<{ keywords: string[]; category: ProductCategory }> = [
  { keywords: ["boot", "cleat", "footwear", "shoe"], category: "BOOTS" },
  { keywords: ["jersey", "shirt", "kit", "top"], category: "JERSEYS" },
  { keywords: ["ball", "football", "soccer ball"], category: "FOOTBALLS" },
  { keywords: ["trading card", "card", "panini"], category: "TRADING_CARDS" },
  { keywords: ["glove", "goalkeeper"], category: "GOALKEEPER_GLOVES" },
  { keywords: ["shin guard", "shin pad", "shinpad"], category: "SHIN_GUARDS" },
  { keywords: ["training", "gym", "exercise"], category: "TRAINING_EQUIPMENT" },
];

export function normaliseCategory(raw: string): ProductCategory | null {
  if (!raw.trim()) return null;
  const lower = raw.toLowerCase();
  for (const { keywords, category } of RULES) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null;
}
```

- [ ] **Step 5: Implement `lib/import/normalise-condition.ts`**

```ts
import type { ProductCondition } from "@prisma/client";

const RULES: Array<{ keywords: string[]; condition: ProductCondition }> = [
  { keywords: ["brand new", "bnib"], condition: "BRAND_NEW" },
  { keywords: ["new with tags", "bnwt"], condition: "NEW_WITH_TAGS" },
  { keywords: ["new without tags", "bnwob"], condition: "NEW_WITHOUT_TAGS" },
  { keywords: ["like new", "excellent", "near mint"], condition: "USED_LIKE_NEW" },
  { keywords: ["very good", "good"], condition: "USED_GOOD" },
  { keywords: ["fair", "acceptable", "poor"], condition: "USED_FAIR" },
];

export function normaliseCondition(raw: string): ProductCondition {
  const lower = raw.toLowerCase().trim();
  for (const { keywords, condition } of RULES) {
    if (keywords.some((kw) => lower.includes(kw))) return condition;
  }
  return "USED_GOOD";
}
```

- [ ] **Step 6: Run — verify all pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "PASS|FAIL|✓|✗"
```

Expected: all 31 tests pass (17 category + 14 condition)

- [ ] **Step 7: Commit**

```bash
git add lib/import/normalise-category.ts lib/import/normalise-condition.ts \
  __tests__/lib/import/normalise-category.test.ts \
  __tests__/lib/import/normalise-condition.test.ts
git commit -m "feat: add category and condition normalisation utilities with tests"
```

---

## Task 5: CSV Parser Utility

**Files:**
- Create: `lib/import/parse-csv.ts`
- Create: `__tests__/lib/import/parse-csv.test.ts`

- [ ] **Step 1: Write failing tests**

Create `__tests__/lib/import/parse-csv.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseCsv } from "@/lib/import/parse-csv";

const HEADER = "title,description,price,compare_at_price,category,subcategory,brand,condition,images,tags,sku,inventory,has_variants,variant_size_value,variant_size_system,variant_price,variant_inventory,variant_sku,variant_color";

describe("parseCsv", () => {
  it("parses a simple product row", () => {
    const csv = [HEADER, 'Nike Boot,Great boot,199.99,,BOOTS,,Nike,BRAND_NEW,https://img.com/1.jpg,nike,SKU1,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Nike Boot");
    expect(rows[0].price).toBe(199.99);
    expect(rows[0].category).toBe("BOOTS");
    expect(rows[0].status).toBe("ready");
  });

  it("uses title as description fallback when description is blank", () => {
    const csv = [HEADER, 'Nike Boot,,199.99,,BOOTS,,Nike,BRAND_NEW,,,SKU2,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows[0].description).toBe("Nike Boot");
  });

  it("flags unrecognised category as skip", () => {
    const csv = [HEADER, 'Weird Thing,Desc,10,,RANDOM,,Brand,BRAND_NEW,,,SKU3,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows[0].status).toBe("skip");
    expect(rows[0].category).toBeNull();
  });

  it("flags unrecognised size as fix_size", () => {
    const csv = [HEADER, 'Boot,Desc,199,,BOOTS,,Nike,BRAND_NEW,,,SKU4,0,true,10.5 weird,,199,,SKU4v,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows[0].status).toBe("fix_size");
    expect(rows[0].sizeSystem).toBeNull();
  });

  it("sanitises formula injection in title", () => {
    const csv = [HEADER, '=SUM(1),Desc,10,,BOOTS,,Nike,BRAND_NEW,,,SKU5,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows[0].title).not.toMatch(/^=/);
  });

  it("skips comment rows starting with #", () => {
    const csv = ["# this is a comment", HEADER, 'Nike Boot,Desc,199.99,,BOOTS,,Nike,BRAND_NEW,,,SKU6,1,false,,,,,,'].join("\n");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
  });

  it("groups variant rows with same title into one product", () => {
    const csv = [
      HEADER,
      'Adidas Boot,Desc,229,,BOOTS,,Adidas,BRAND_NEW,,,, ,true,9,UK,229,2,SKU-UK9,',
      'Adidas Boot,,,,,,,,,,,, ,true,10,UK,229,3,SKU-UK10,',
    ].join("\n");
    const rows = parseCsv(csv);
    // Two variant rows grouped under one product = 2 ImportRows with same title
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe("Adidas Boot");
    expect(rows[1].title).toBe("Adidas Boot");
    expect(rows[0].hasVariants).toBe(true);
    expect(rows[0].sizeSystem).toBe("UK");
  });

  it("returns empty array for empty CSV", () => {
    expect(parseCsv("")).toHaveLength(0);
    expect(parseCsv(HEADER)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run — verify all fail**

```bash
npm test -- --reporter=verbose 2>&1 | head -20
```

Expected: `Cannot find module '@/lib/import/parse-csv'`

- [ ] **Step 3: Implement `lib/import/parse-csv.ts`**

```ts
import { createId } from "@paralleldrive/cuid2";
import { normaliseSize } from "./normalise-size";
import { normaliseCategory } from "./normalise-category";
import { normaliseCondition } from "./normalise-condition";
import type { ImportRow, ImportRowStatus } from "./types";

const FORMULA_PREFIXES = /^[=+\-@]/;

function sanitiseCell(value: string): string {
  return FORMULA_PREFIXES.test(value) ? `'${value}` : value;
}

function parseRow(raw: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuotes && raw[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function parseCsv(csvText: string): ImportRow[] {
  const lines = csvText
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l && !l.startsWith("#"));

  if (lines.length === 0) return [];

  const headers = parseRow(lines[0]).map((h) => h.trim().toLowerCase());
  const dataLines = lines.slice(1);
  if (dataLines.length === 0) return [];

  // Track first-row data for variant grouping (title → first-row data)
  const productData: Record<string, Partial<ImportRow>> = {};

  return dataLines.map((line) => {
    const cells = parseRow(line).map((c) => sanitiseCell(c.trim()));
    const get = (col: string) => cells[headers.indexOf(col)] ?? "";

    const rawTitle = get("title");
    const isVariantContinuation = rawTitle === "" || !!productData[rawTitle];

    // For variant continuation rows, reuse the first row's product data
    const title = rawTitle || Object.keys(productData).at(-1) || "";
    const description = get("description") || title;
    const priceRaw = parseFloat(get("price"));
    const price = isNaN(priceRaw) ? 0 : priceRaw;
    const compareAtPriceRaw = parseFloat(get("compare_at_price"));
    const compareAtPrice = isNaN(compareAtPriceRaw) ? undefined : compareAtPriceRaw;
    const rawCategory = get("category");
    const category = normaliseCategory(rawCategory);
    const condition = normaliseCondition(get("condition"));
    const brand = get("brand") || undefined;
    const images = get("images")
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);
    const tags = get("tags")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const sku = get("sku") || undefined;
    const inventory = parseInt(get("inventory"), 10) || 0;
    const hasVariants = get("has_variants").toLowerCase() === "true";
    const variantSizeRaw = get("variant_size_value");
    const variantSizeSystem = get("variant_size_system") || undefined;
    const variantPriceRaw = parseFloat(get("variant_price"));
    const variantPrice = isNaN(variantPriceRaw) ? undefined : variantPriceRaw;
    const variantInventory = parseInt(get("variant_inventory"), 10) || 0;
    const variantSku = get("variant_sku") || undefined;
    const variantColor = get("variant_color") || undefined;

    // Normalise size
    let sizeSystem: ImportRow["sizeSystem"] = undefined;
    let sizeValue: string | undefined;
    let sizeDisplay: string | undefined;

    if (hasVariants && variantSizeRaw) {
      const sizeInput = variantSizeSystem
        ? `${variantSizeSystem} ${variantSizeRaw}`
        : variantSizeRaw;
      const resolved = normaliseSize(sizeInput);
      if (resolved) {
        sizeSystem = resolved.sizeSystem;
        sizeValue = resolved.sizeValue;
        sizeDisplay = resolved.sizeDisplay;
      } else {
        sizeSystem = null;
        sizeValue = variantSizeRaw;
      }
    }

    // Determine status
    let status: ImportRowStatus = "ready";
    let statusReason: string | undefined;

    if (!category) {
      status = "skip";
      statusReason = `Unrecognised category: "${rawCategory}"`;
    } else if (hasVariants && sizeSystem === null) {
      status = "fix_size";
      statusReason = `Could not parse size: "${variantSizeRaw}"`;
    }

    if (!productData[title]) {
      productData[title] = { title, description, price, category, condition };
    }

    return {
      id: createId(),
      title,
      description,
      price,
      compareAtPrice,
      category,
      brand,
      condition,
      images,
      tags,
      sku,
      inventory,
      hasVariants,
      sizeValue,
      sizeSystem,
      sizeDisplay,
      variantPrice,
      variantInventory,
      variantSku,
      variantColor,
      status,
      statusReason,
    } satisfies ImportRow;
  });
}
```

- [ ] **Step 4: Install cuid2**

```bash
npm install @paralleldrive/cuid2
```

- [ ] **Step 5: Run — verify all pass**

```bash
npm test -- --reporter=verbose 2>&1 | grep -E "PASS|FAIL|✓|✗"
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add lib/import/parse-csv.ts __tests__/lib/import/parse-csv.test.ts package.json package-lock.json
git commit -m "feat: add CSV parser utility with tests"
```

---

## Task 6: Template Route (verify existing)

**Files:**
- Verify/modify: `app/api/products/bulk-import/template/route.ts`

- [ ] **Step 1: Review the existing file**

Read `app/api/products/bulk-import/template/route.ts`. Confirm:
- Returns a CSV with comment rows listing valid values for `category`, `condition`, `variant_size_system`
- Has two example products (one simple, one with variants)
- Headers match: `title,description,price,compare_at_price,category,subcategory,brand,condition,images,tags,sku,inventory,has_variants,variant_size_value,variant_size_system,variant_price,variant_inventory,variant_sku,variant_color`

- [ ] **Step 2: Test manually**

```bash
curl http://localhost:3000/api/products/bulk-import/template -o /tmp/test.csv && head -10 /tmp/test.csv
```

Expected: CSV downloads with headers and comment rows.

- [ ] **Step 3: Commit if changes were needed, skip if unchanged**

```bash
git add app/api/products/bulk-import/template/route.ts
git commit -m "feat: verify bulk import CSV template route"
```

---

## Task 7: `/parse` API Route

**Files:**
- Create: `app/api/products/bulk-import/parse/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseCsv } from "@/lib/import/parse-csv";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 5000;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_BYTES) {
    return NextResponse.json({ error: "File too large. Maximum size is 5 MB." }, { status: 400 });
  }

  let csvText: string;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const buffer = await (file as File).arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum size is 5 MB." }, { status: 400 });
    }
    csvText = new TextDecoder().decode(buffer);
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 400 });
  }

  const rows = parseCsv(csvText);

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows. Maximum is ${MAX_ROWS}, got ${rows.length}.` },
      { status: 400 }
    );
  }

  return NextResponse.json({ rows, total: rows.length });
}
```

- [ ] **Step 2: Manual smoke test (dev server must be running)**

```bash
curl -s -X POST http://localhost:3000/api/products/bulk-import/parse \
  -F "file=@/tmp/test.csv" | jq '.total'
```

Expected: a number (0 or more rows)

- [ ] **Step 3: Commit**

```bash
git add app/api/products/bulk-import/parse/route.ts
git commit -m "feat: add /parse bulk import route"
```

---

## Task 8: `/session` API Route

**Files:**
- Create: `app/api/products/bulk-import/session/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const importSession = await prisma.importSession.findUnique({ where: { id } });

  if (!importSession) {
    return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
  }

  if (new Date() > importSession.expiresAt) {
    await prisma.importSession.delete({ where: { id } });
    return NextResponse.json({ error: "Session expired" }, { status: 410 });
  }

  return NextResponse.json({ rows: importSession.rows, platform: importSession.platform });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/products/bulk-import/session/route.ts
git commit -m "feat: add /session bulk import route"
```

---

## Task 9: `/confirm` API Route

**Files:**
- Create: `app/api/products/bulk-import/confirm/route.ts`

- [ ] **Step 1: Create the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { SizeSystem, ProductCategory, ProductCondition } from "@prisma/client";

const MAX_ROWS = 5000;

const variantSchema = z.object({
  sizeValue: z.string(),
  sizeSystem: z.string(),
  price: z.number(),
  inventory: z.number().int(),
  sku: z.string().optional(),
  color: z.string().optional(),
});

const rowSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  category: z.string(),
  condition: z.string(),
  brand: z.string().optional(),
  sku: z.string().optional(),
  inventory: z.number().int().nonnegative(),
  images: z.array(z.string()),
  tags: z.array(z.string()),
  hasVariants: z.boolean(),
  sizeValue: z.string().optional(),
  sizeSystem: z.string().optional().nullable(),
  sizeDisplay: z.string().optional(),
  variantPrice: z.number().optional(),
  variantInventory: z.number().optional(),
  variantSku: z.string().optional(),
  variantColor: z.string().optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).max(MAX_ROWS),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the seller profile for this user
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!sellerProfile) {
    return NextResponse.json({ error: "No seller profile found" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Maximum ${MAX_ROWS} rows per import` }, { status: 400 });
  }

  // Check for SKU conflicts
  const skusToCheck = body.rows
    .map((r) => r.sku)
    .filter((s): s is string => !!s);
  const existingSkus = new Set(
    (await prisma.product.findMany({
      where: { sellerProfileId: sellerProfile.id, sku: { in: skusToCheck } },
      select: { sku: true },
    })).map((p) => p.sku)
  );

  let created = 0;
  let skipped = 0;

  try {
    await prisma.$transaction(async (tx) => {
      for (const row of body.rows) {
        if (row.sku && existingSkus.has(row.sku)) {
          skipped++;
          continue;
        }

        const sizeDisplay =
          row.sizeDisplay ??
          (row.sizeSystem && row.sizeValue ? `${row.sizeSystem} ${row.sizeValue}` : undefined);

        await tx.product.create({
          data: {
            sellerProfileId: sellerProfile.id,
            title: row.title,
            description: row.description || row.title,
            price: row.price,
            compareAtPrice: row.compareAtPrice,
            category: row.category as ProductCategory,
            condition: row.condition as ProductCondition,
            brand: row.brand,
            sku: row.sku || `IMPORT-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
            inventory: row.hasVariants ? 0 : row.inventory,
            images: row.images,
            tags: row.tags,
            isActive: false,
            hasVariants: row.hasVariants,
            variants:
              row.hasVariants && row.sizeValue && row.sizeSystem
                ? {
                    create: [
                      {
                        sizeValue: row.sizeValue,
                        sizeSystem: row.sizeSystem as SizeSystem,
                        sizeDisplay: sizeDisplay ?? `${row.sizeSystem} ${row.sizeValue}`,
                        color: row.variantColor,
                        sku: row.variantSku,
                        price: row.variantPrice ?? row.price,
                        inventory: row.variantInventory ?? row.inventory,
                      },
                    ],
                  }
                : undefined,
          },
        });
        created++;
      }
    });
  } catch (error) {
    console.error("[bulk-import/confirm] transaction failed:", error);
    return NextResponse.json(
      { error: "Import failed. No products were created. Please try again." },
      { status: 500 }
    );
  }

  // Clean up ImportSession if one was used
  if (body.sessionId) {
    await prisma.importSession.deleteMany({ where: { id: body.sessionId } });
  }

  return NextResponse.json({ created, skipped, reason: skipped > 0 ? "duplicate_sku" : undefined });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/products/bulk-import/confirm/route.ts
git commit -m "feat: add /confirm bulk import route with transaction and SKU dedup"
```

---

## Task 10: Shopify OAuth Routes

**Files:**
- Create: `app/api/products/bulk-import/shopify/connect/route.ts`
- Create: `app/api/products/bulk-import/shopify/callback/route.ts`

> **Note:** Shopify OAuth requires a registered app. Set `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_REDIRECT_URI` in `.env.local`. The callback will fail gracefully (400) if the app is not registered — the UI shell still works.

- [ ] **Step 1: Create connect route**

```ts
// app/api/products/bulk-import/shopify/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop"); // e.g. mystore.myshopify.com
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("import_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_CLIENT_ID!,
    scope: "read_products",
    redirect_uri: process.env.SHOPIFY_REDIRECT_URI!,
    state,
  });

  return NextResponse.redirect(
    `https://${shop}/admin/oauth/authorize?${params.toString()}`
  );
}
```

- [ ] **Step 2: Create callback route**

```ts
// app/api/products/bulk-import/shopify/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createId } from "@paralleldrive/cuid2";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("import_oauth_state")?.value;
  cookieStore.delete("import_oauth_state");

  if (!state || !savedState || state !== savedState) {
    return NextResponse.json({ error: "Invalid state. Possible CSRF attack." }, { status: 400 });
  }

  if (!code || !shop) {
    return NextResponse.json({ error: "Missing code or shop" }, { status: 400 });
  }

  // Exchange code for token
  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json({ error: "Failed to exchange token" }, { status: 502 });
  }

  const { access_token } = await tokenRes.json();

  // Store token on SellerProfile
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!sellerProfile) {
    return NextResponse.json({ error: "No seller profile" }, { status: 403 });
  }

  await prisma.sellerProfile.update({
    where: { id: sellerProfile.id },
    data: {
      shopifyAccessToken: access_token,
      shopifyShopDomain: shop,
    },
  });

  // Fetch products from Shopify
  const productsRes = await fetch(
    `https://${shop}/admin/api/2024-01/products.json?limit=250`,
    { headers: { "X-Shopify-Access-Token": access_token } }
  );

  if (!productsRes.ok) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=shopify_fetch_failed`, request.url)
    );
  }

  const { products } = await productsRes.json();

  // Normalise to ImportRow format (simplified — full normalisation uses the same utilities)
  const { normaliseCategory } = await import("@/lib/import/normalise-category");
  const { normaliseCondition } = await import("@/lib/import/normalise-condition");
  const { normaliseSize } = await import("@/lib/import/normalise-size");
  const { createId: cuid } = await import("@paralleldrive/cuid2");

  const rows = products.flatMap((product: any) =>
    product.variants.map((variant: any) => {
      const category = normaliseCategory(product.product_type || "");
      const size = normaliseSize(variant.title !== "Default Title" ? variant.title : "");
      return {
        id: cuid(),
        title: product.title,
        description: product.body_html?.replace(/<[^>]+>/g, "") || product.title,
        price: parseFloat(variant.price),
        category,
        condition: normaliseCondition(""),
        brand: product.vendor,
        sku: variant.sku || undefined,
        inventory: variant.inventory_quantity ?? 0,
        images: product.images.map((i: any) => i.src),
        tags: product.tags ? product.tags.split(",").map((t: string) => t.trim()) : [],
        hasVariants: product.variants.length > 1,
        sizeValue: size?.sizeValue,
        sizeSystem: size?.sizeSystem ?? null,
        sizeDisplay: size?.sizeDisplay,
        status: !category ? "skip" : size === null && variant.title !== "Default Title" ? "fix_size" : "ready",
        sourcePlatform: "shopify",
        sourceThumbnail: product.images[0]?.src,
      };
    })
  );

  // Store in ImportSession
  const importSession = await prisma.importSession.create({
    data: {
      sellerId: sellerProfile.id,
      platform: "shopify",
      rows,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return NextResponse.redirect(
    new URL(`/dashboard/organization/import?session=${importSession.id}`, request.url)
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/products/bulk-import/shopify/
git commit -m "feat: add Shopify OAuth connect and callback routes"
```

---

## Task 11: eBay OAuth Routes

**Files:**
- Create: `app/api/products/bulk-import/ebay/connect/route.ts`
- Create: `app/api/products/bulk-import/ebay/callback/route.ts`

> **Note:** Register an eBay app at developer.ebay.com. Set `EBAY_CLIENT_ID`, `EBAY_CLIENT_SECRET`, `EBAY_REDIRECT_URI` in `.env.local`.

- [ ] **Step 1: Create connect route**

```ts
// app/api/products/bulk-import/ebay/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly";
const EBAY_AUTH_URL = "https://auth.ebay.com/oauth2/authorize";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("import_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: process.env.EBAY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.EBAY_REDIRECT_URI!,
    scope: EBAY_SCOPE,
    state,
  });

  return NextResponse.redirect(`${EBAY_AUTH_URL}?${params.toString()}`);
}
```

- [ ] **Step 2: Create callback route**

```ts
// app/api/products/bulk-import/ebay/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("import_oauth_state")?.value;
  cookieStore.delete("import_oauth_state");

  if (!state || !savedState || state !== savedState) {
    return NextResponse.json({ error: "Invalid state. Possible CSRF attack." }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!sellerProfile) {
    return NextResponse.json({ error: "No seller profile" }, { status: 403 });
  }

  // Exchange code for tokens
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.EBAY_REDIRECT_URI!,
    }).toString(),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_token_failed`, request.url)
    );
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.sellerProfile.update({
    where: { id: sellerProfile.id },
    data: {
      ebayAccessToken: tokens.access_token,
      ebayRefreshToken: tokens.refresh_token,
      ebayTokenExpiresAt: expiresAt,
    },
  });

  // Fetch listings from eBay Sell Inventory API
  const listingsRes = await fetch(
    "https://api.ebay.com/sell/inventory/v1/inventory_item?limit=200",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );

  if (!listingsRes.ok) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_fetch_failed`, request.url)
    );
  }

  const { inventoryItems } = await listingsRes.json();

  const { normaliseCategory } = await import("@/lib/import/normalise-category");
  const { normaliseCondition } = await import("@/lib/import/normalise-condition");
  const { normaliseSize } = await import("@/lib/import/normalise-size");
  const { createId } = await import("@paralleldrive/cuid2");

  const rows = (inventoryItems ?? []).map((item: any) => {
    const product = item.product ?? {};
    const category = normaliseCategory(item.groupType ?? "");
    const rawSize = product.aspects?.Size?.[0] ?? "";
    const size = normaliseSize(rawSize);
    const price = parseFloat(item.availability?.shipToLocationAvailability?.quantity ?? "0");

    return {
      id: createId(),
      title: product.title ?? "Untitled",
      description: product.description || product.title || "Untitled",
      price: 0, // eBay inventory API doesn't include price; seller sets it
      category,
      condition: normaliseCondition(item.condition ?? ""),
      brand: product.brand,
      sku: item.sku,
      inventory: item.availability?.shipToLocationAvailability?.quantity ?? 0,
      images: (product.imageUrls ?? []).slice(0, 8),
      tags: [],
      hasVariants: false,
      sizeValue: size?.sizeValue,
      sizeSystem: size?.sizeSystem ?? (rawSize ? null : undefined),
      sizeDisplay: size?.sizeDisplay,
      status: !category ? "skip" : size === null && rawSize ? "fix_size" : "ready",
      sourcePlatform: "ebay",
      sourceThumbnail: product.imageUrls?.[0],
    };
  });

  const importSession = await prisma.importSession.create({
    data: {
      sellerId: sellerProfile.id,
      platform: "ebay",
      rows,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return NextResponse.redirect(
    new URL(`/dashboard/organization/import?session=${importSession.id}`, request.url)
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/products/bulk-import/ebay/
git commit -m "feat: add eBay OAuth connect and callback routes"
```

---

## Task 12: Sidebar Nav Item

**Files:**
- Modify: `components/sidebar/dashboard/sidebar-items.tsx`

- [ ] **Step 1: Add Import entry to the Store section**

In `components/sidebar/dashboard/sidebar-items.tsx`, find the Store section (around line 117). Add the Import item after the listings entry:

```ts
{
  key: "import",
  href: "/dashboard/organization/import",
  icon: "solar:upload-outline",
  title: "Import",
},
```

Place it directly after the `listings` item and before `org-orders`.

- [ ] **Step 2: Verify in browser**

Start dev server: `npm run dev`
Navigate to the seller dashboard. Confirm "Import" appears in the sidebar under Store with an upload icon.

- [ ] **Step 3: Commit**

```bash
git add components/sidebar/dashboard/sidebar-items.tsx
git commit -m "feat: add Import nav item to seller sidebar"
```

---

## Task 13: Listings Page Import Button

**Files:**
- Modify: `components/dashboard/organizations/listings/app.tsx`

- [ ] **Step 1: Add Import button next to Add Product**

In `components/dashboard/organizations/listings/app.tsx`, find the header section (around line 160–178) where the `Add Product` button lives. Add an Import button before it:

```tsx
import { useRouter } from "next/navigation";
// (useRouter is likely already imported)

// Inside the component, add:
const router = useRouter();

// In the JSX, replace the button group with:
<div className="flex gap-2 items-center">
  <Button
    variant="flat"
    size="sm"
    startContent={<Icon icon="solar:upload-outline" className="w-4 h-4" />}
    onPress={() => router.push("/dashboard/organization/import")}
  >
    Import
  </Button>
  <Button
    color="primary"
    variant="flat"
    size="sm"
    startContent={<Icon icon="solar:add-circle-linear" className="w-4 h-4" />}
    onPress={handleCreateProduct}
  >
    Add Product
  </Button>
</div>
```

- [ ] **Step 2: Verify in browser**

Navigate to `/dashboard/organization/listings`. Confirm both "Import" and "Add Product" appear side-by-side. Clicking Import navigates to the import page.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/organizations/listings/app.tsx
git commit -m "feat: add Import button to listings page header"
```

---

## Task 14: Import Page Route

**Files:**
- Create: `app/(dashboard)/dashboard/organization/import/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import { useOrganizationStore } from "@/lib/stores/organization";
import ImportPlatformGrid from "@/components/dashboard/organizations/import/platform-grid";
import ImportSocialTrack from "@/components/dashboard/organizations/import/social-track";
import ImportCsvDropZone from "@/components/dashboard/organizations/import/csv-drop-zone";
import ImportReviewTable from "@/components/dashboard/organizations/import/review-table";
import ImportSuccessScreen from "@/components/dashboard/organizations/import/success-screen";
import type { ImportRow } from "@/lib/import/types";

export const dynamic = "force-dynamic";

type ImportStage = "landing" | "review" | "success";

export default function ImportPage() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeOrganization = useOrganizationStore((state) => state.activeOrganization);

  const [stage, setStage] = useState<ImportStage>("landing");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [importedCount, setImportedCount] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(false);

  useEffect(() => {
    if (!sessionPending && !session) router.push("/auth/login");
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (!activeOrganization && !sessionPending && session) router.push("/dashboard");
  }, [activeOrganization, sessionPending, session, router]);

  // Handle OAuth redirect with ?session= param
  useEffect(() => {
    const sid = searchParams.get("session");
    if (!sid || stage !== "landing") return;
    setSessionId(sid);
    setSessionLoading(true);
    fetch(`/api/products/bulk-import/session?id=${sid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rows) {
          setRows(data.rows as ImportRow[]);
          setStage("review");
        }
      })
      .catch(console.error)
      .finally(() => setSessionLoading(false));
  }, [searchParams, stage]);

  if (typeof window === "undefined" || sessionPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) return null;

  const handleCsvParsed = (parsedRows: ImportRow[]) => {
    setRows(parsedRows);
    setStage("review");
  };

  const handleConfirmed = (count: number) => {
    setImportedCount(count);
    setStage("success");
  };

  const handleReset = () => {
    setRows([]);
    setSessionId(undefined);
    setStage("landing");
    router.replace("/dashboard/organization/import");
  };

  return (
    <SidebarWrapper>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {sessionLoading && (
          <div className="flex items-center justify-center py-24">
            <Spinner size="lg" label="Loading your listings..." />
          </div>
        )}

        {!sessionLoading && stage === "landing" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">Import Products</h1>
              <p className="text-sm text-default-500 mt-1">
                Move your listings to MDFLD — whether you're on a marketplace, social media, or building from scratch.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <ImportPlatformGrid />
              <ImportSocialTrack />
            </div>
            <ImportCsvDropZone onParsed={handleCsvParsed} />
          </>
        )}

        {stage === "review" && (
          <ImportReviewTable
            rows={rows}
            sessionId={sessionId}
            onConfirmed={handleConfirmed}
            onBack={handleReset}
          />
        )}

        {stage === "success" && (
          <ImportSuccessScreen
            count={importedCount}
            onImportMore={handleReset}
          />
        )}
      </div>
    </SidebarWrapper>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(dashboard\)/dashboard/organization/import/
git commit -m "feat: add import page route with stage management"
```

---

## Task 15: ImportPlatformGrid Component

**Files:**
- Create: `components/dashboard/organizations/import/platform-grid.tsx`
- Create: `components/dashboard/organizations/import/guide-modal.tsx`

- [ ] **Step 1: Create platform-grid.tsx**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import GuideModal from "./guide-modal";

type Platform = {
  key: string;
  name: string;
  type: "api" | "guide";
  icon: React.ReactNode;
  guideSteps?: string[];
  connectHref?: string;
};

// Inline SVG brand icons (no emoji)
const ShopifyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 109.5 124.5" fill="#96bf48">
    <path d="M74.7 14.8s-1.4.4-3.7 1.1c-.4-1.3-1-2.8-1.8-4.4-2.6-5-6.5-7.7-11.1-7.7-.3 0-.6 0-1 .1-.1-.2-.3-.3-.4-.5-2-2.2-4.6-3.2-7.7-3.1-6 .2-12 4.5-16.8 12.2-3.4 5.4-6 12.2-6.7 17.5-6.9 2.1-11.7 3.6-11.8 3.7-3.5 1.1-3.6 1.2-4 4.5C9.4 41 0 116.4 0 116.4l75.6 13.1V14.6c-.3.1-.6.1-.9.2zm-16.5 5.2c-4 1.2-8.4 2.6-12.7 3.9.6-3.8 1.8-7.5 3.6-10.6 1.6-2.8 3.7-5.1 6.2-6.4 2.2 3.8 3.1 8.6 2.9 13.1zm-9.4-16.1c.8-.1 1.6.2 2.3.7-2.9 1.5-5.7 4.3-7.7 7.6-2.3 4.1-4 9.1-4.6 14.1-3.6 1.1-7.2 2.2-10.5 3.2 1.8-9.8 9.2-25 20.5-25.6zM44 72.5c.4 6.4 17.3 7.8 18.3 22.9.7 11.9-6.3 20-16.4 20.6-12.2.8-18.9-6.4-18.9-6.4l2.6-11s6.7 5.1 12.1 4.7c3.5-.2 4.8-3.1 4.7-5.1-.5-8.4-14.3-7.9-15.2-21.7-.8-11.6 6.9-23.4 23.7-24.4 6.5-.4 9.8 1.2 9.8 1.2l-3.8 14.4s-4.3-2-9.4-1.7c-7.4.5-7.6 5.2-7.5 6.5zm22.3-53.8c0-4.3-.6-10.4-2.6-15.5 6.6 1.3 9.8 8.7 11.1 13.2-2.6.8-5.4 1.6-8.5 2.3z"/>
    <path d="M76.5 129.4l33-8.2S95.4 30.9 95.3 30.2c-.1-.7-.7-1.1-1.2-1.1-1.2-.1-12.8-.3-12.8-.3s-3.3-3.2-4.7-4.4v105z" fill="#5e8e3e"/>
  </svg>
);

const EbayIcon = () => (
  <svg width="28" height="16" viewBox="0 0 600 240">
    <text fontFamily="Arial Black, sans-serif" fontSize="220" fontWeight="900" y="210">
      <tspan fill="#e53238">e</tspan>
      <tspan fill="#0064d2">B</tspan>
      <tspan fill="#f5af02">a</tspan>
      <tspan fill="#86b817">y</tspan>
    </text>
  </svg>
);

const DepopIcon = () => (
  <svg width="22" height="22" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="100" fill="#FF0054"/>
    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial Black" fontSize="90" fontWeight="900" fill="white">d</text>
  </svg>
);

const VintedIcon = () => (
  <svg width="22" height="22" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="16" fill="#21D179"/>
    <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial Black" fontSize="72" fontWeight="900" fill="white">V</text>
  </svg>
);

const WixIcon = () => (
  <svg width="30" height="14" viewBox="0 0 220 80">
    <text fontFamily="Arial Black" fontSize="72" fontWeight="900" fill="#FAAD00" y="68">Wix</text>
  </svg>
);

const WooIcon = () => (
  <svg width="32" height="18" viewBox="0 0 200 120">
    <rect width="200" height="120" rx="10" fill="#7F54B3"/>
    <text x="50%" y="62%" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial" fontSize="28" fontWeight="700" fill="white">Woo</text>
  </svg>
);

const GodaddyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 200 200">
    <circle cx="100" cy="100" r="100" fill="#1BDBDB"/>
    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial Black" fontSize="72" fontWeight="900" fill="white">G</text>
  </svg>
);

const PLATFORMS: Platform[] = [
  {
    key: "shopify",
    name: "Shopify",
    type: "api",
    icon: <ShopifyIcon />,
    connectHref: "/api/products/bulk-import/shopify/connect",
  },
  {
    key: "ebay",
    name: "eBay",
    type: "api",
    icon: <EbayIcon />,
    connectHref: "/api/products/bulk-import/ebay/connect",
  },
  {
    key: "depop",
    name: "Depop",
    type: "guide",
    icon: <DepopIcon />,
    guideSteps: [
      "Open the Depop app and go to your Profile",
      "Tap the three-dot menu (⋯) in the top right",
      "Select Settings → Privacy → Request my data",
      "Depop will email you a CSV file within 24 hours",
      "Download the CSV and upload it here",
    ],
  },
  {
    key: "vinted",
    name: "Vinted",
    type: "guide",
    icon: <VintedIcon />,
    guideSteps: [
      "Log in to Vinted on desktop at vinted.com",
      "Go to your Account Settings",
      "Select Privacy → Download my data",
      "You will receive an email with a CSV download link",
      "Download the file and upload it here",
    ],
  },
  {
    key: "wix",
    name: "Wix",
    type: "guide",
    icon: <WixIcon />,
    guideSteps: [
      "Log in to your Wix dashboard",
      "Go to Stores → Products",
      "Click the three-dot menu → Export Products",
      "Download the CSV file",
      "Upload it here",
    ],
  },
  {
    key: "woocommerce",
    name: "WooCommerce",
    type: "guide",
    icon: <WooIcon />,
    guideSteps: [
      "Log in to your WordPress admin panel",
      "Go to WooCommerce → Products",
      "Click Export at the top of the page",
      "Select All columns and click Generate CSV",
      "Download and upload the file here",
    ],
  },
  {
    key: "godaddy",
    name: "GoDaddy",
    type: "guide",
    icon: <GodaddyIcon />,
    guideSteps: [
      "Log in to your GoDaddy Online Store",
      "Go to Products in your dashboard",
      "Click Export → Export All Products",
      "Download the CSV file that is emailed to you",
      "Upload it here",
    ],
  },
];

export default function ImportPlatformGrid() {
  const router = useRouter();
  const [guideOpen, setGuideOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);

  const handleClick = (platform: Platform) => {
    if (platform.type === "api" && platform.connectHref) {
      router.push(platform.connectHref);
    } else {
      setActivePlatform(platform);
      setGuideOpen(true);
    }
  };

  return (
    <div className="bg-content1 border border-divider rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-1">Marketplace or store</h2>
      <p className="text-xs text-default-400 mb-4">
        Connect your store or follow a step-by-step export guide.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map((platform) => (
          <button
            key={platform.key}
            onClick={() => handleClick(platform)}
            className="flex items-center gap-3 bg-content2 border border-divider rounded-lg px-3 py-2.5 text-left hover:border-default-400 transition-colors"
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {platform.icon}
            </div>
            <span className="text-xs font-medium text-foreground flex-1">{platform.name}</span>
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                platform.type === "api"
                  ? "bg-success-50 text-success-700"
                  : "bg-default-100 text-default-400"
              }`}
            >
              {platform.type === "api" ? "API" : "Guide"}
            </span>
          </button>
        ))}
        <button className="flex items-center justify-center gap-2 border border-dashed border-divider rounded-lg px-3 py-2.5 text-default-400 text-xs hover:border-default-400 transition-colors">
          More platforms
        </button>
      </div>

      {activePlatform && (
        <GuideModal
          isOpen={guideOpen}
          onClose={() => setGuideOpen(false)}
          platform={activePlatform.name}
          steps={activePlatform.guideSteps ?? []}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create guide-modal.tsx**

```tsx
"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  steps: string[];
}

export default function GuideModal({ isOpen, onClose, platform, steps }: GuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader>Export from {platform}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-500 mb-4">
            Follow these steps to export your listings, then upload the CSV file below.
          </p>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-default-100 text-default-600 flex items-center justify-center text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="text-default-700 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Got it
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/organizations/import/platform-grid.tsx \
  components/dashboard/organizations/import/guide-modal.tsx
git commit -m "feat: add ImportPlatformGrid and GuideModal components"
```

---

## Task 16: ImportSocialTrack Component

**Files:**
- Create: `components/dashboard/organizations/import/social-track.tsx`

- [ ] **Step 1: Create social-track.tsx**

```tsx
"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

export default function ImportSocialTrack() {
  const router = useRouter();

  const handleDownload = () => {
    window.location.href = "/api/products/bulk-import/template";
  };

  return (
    <div className="bg-content1 border border-divider rounded-xl p-5 flex flex-col">
      <h2 className="text-sm font-semibold text-foreground mb-1">Social or informal</h2>
      <p className="text-xs text-default-400 mb-4">
        Selling on Instagram, WhatsApp, or without a proper storefront? We'll walk you through adding your products directly.
      </p>
      <div className="flex flex-col gap-2 mt-auto">
        <p className="text-xs text-default-500">
          Fill in our spreadsheet at your own pace — takes about 2 minutes per product — then upload it below.
        </p>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Icon icon="solar:download-outline" className="w-4 h-4" />}
          onPress={handleDownload}
        >
          Download template
        </Button>
        <Button
          variant="flat"
          size="sm"
          startContent={<Icon icon="solar:add-circle-linear" className="w-4 h-4" />}
          onPress={() => router.push("/dashboard/organization/listings")}
        >
          Add products one by one
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/organizations/import/social-track.tsx
git commit -m "feat: add ImportSocialTrack component"
```

---

## Task 17: ImportCsvDropZone Component

**Files:**
- Create: `components/dashboard/organizations/import/csv-drop-zone.tsx`

- [ ] **Step 1: Create csv-drop-zone.tsx**

```tsx
"use client";

import { useRef, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { ImportRow } from "@/lib/import/types";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;

interface Props {
  onParsed: (rows: ImportRow[]) => void;
}

export default function ImportCsvDropZone({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("File too large. Maximum size is 5 MB.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/products/bulk-import/parse", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to parse file.");
        return;
      }
      if (data.rows.length === 0) {
        setError("No products found in this file. Make sure you're using the MDFLD template format.");
        return;
      }
      onParsed(data.rows as ImportRow[]);
    } catch {
      setError("Something went wrong reading the file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        dragging ? "border-primary bg-primary-50" : "border-divider"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onInputChange}
      />
      {loading ? (
        <div className="flex flex-col items-center gap-2">
          <Spinner size="md" />
          <p className="text-sm text-default-500">Parsing your file...</p>
        </div>
      ) : (
        <>
          <Icon icon="solar:upload-outline" className="w-8 h-8 text-default-300 mx-auto mb-3" />
          <p className="text-sm text-default-500 mb-1">
            Drag & drop any CSV export here
          </p>
          <p className="text-xs text-default-400 mb-4">
            We'll detect the format and map it to MDFLD automatically —{" "}
            <button
              className="text-primary underline"
              onClick={() => inputRef.current?.click()}
            >
              or browse file
            </button>
          </p>
          {error && (
            <p className="text-xs text-danger mt-2">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/organizations/import/csv-drop-zone.tsx
git commit -m "feat: add ImportCsvDropZone component with file size validation"
```

---

## Task 18: ImportReviewTable Component

**Files:**
- Create: `components/dashboard/organizations/import/review-table.tsx`

- [ ] **Step 1: Create review-table.tsx**

```tsx
"use client";

import { useState, useMemo } from "react";
import {
  Button,
  Input,
  Spinner,
  Select,
  SelectItem,
  Checkbox,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { ImportRow, ImportRowStatus } from "@/lib/import/types";
import type { SizeSystem } from "@prisma/client";

const SIZE_SYSTEMS: SizeSystem[] = ["UK", "US", "EU", "JP", "CM", "STANDARD", "ONE_SIZE"];

const STATUS_BADGE: Record<ImportRowStatus, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-success-50 text-success-700" },
  fix_size: { label: "Fix size", className: "bg-warning-50 text-warning-700" },
  skip: { label: "Skip", className: "bg-danger-50 text-danger-700" },
};

interface Props {
  rows: ImportRow[];
  sessionId?: string;
  onConfirmed: (count: number) => void;
  onBack: () => void;
}

export default function ImportReviewTable({ rows, sessionId, onConfirmed, onBack }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(rows.filter((r) => r.status !== "skip").map((r) => r.id))
  );
  const [sizeFixMap, setSizeFixMap] = useState<Record<string, SizeSystem>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => r.title.toLowerCase().includes(q));
  }, [rows, search]);

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === rows.filter((r) => r.status !== "skip").length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.filter((r) => r.status !== "skip").map((r) => r.id)));
    }
  };

  const canConfirm = useMemo(() => {
    return [...selected].some((id) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return false;
      if (row.status === "fix_size") return !!sizeFixMap[id];
      return row.status === "ready";
    });
  }, [selected, rows, sizeFixMap]);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);

    const selectedRows = rows
      .filter((r) => selected.has(r.id))
      .filter((r) => r.status !== "fix_size" || sizeFixMap[r.id])
      .map((r) => ({
        ...r,
        sizeSystem: r.status === "fix_size" ? sizeFixMap[r.id] : r.sizeSystem,
        sizeDisplay:
          r.status === "fix_size" && sizeFixMap[r.id]
            ? `${sizeFixMap[r.id]} ${r.sizeValue}`
            : r.sizeDisplay,
      }));

    try {
      const res = await fetch("/api/products/bulk-import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: selectedRows, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed. Please try again.");
        return;
      }
      onConfirmed(data.created);
    } catch {
      setError("Something went wrong. No products were created. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const readyCount = [...selected].filter((id) => {
    const r = rows.find((row) => row.id === id);
    return r && (r.status === "ready" || (r.status === "fix_size" && sizeFixMap[id]));
  }).length;

  const fixCount = rows.filter((r) => r.status === "fix_size").length;
  const skipCount = rows.filter((r) => r.status === "skip").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-sm text-default-400 flex items-center gap-1 mb-2 hover:text-foreground">
            <Icon icon="solar:arrow-left-outline" className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-semibold">Review your listings</h1>
          <p className="text-sm text-default-500 mt-1">
            {rows.length} products found · {readyCount} selected
          </p>
        </div>
        <Input
          placeholder="Search listings..."
          size="sm"
          className="w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<Icon icon="solar:magnifer-outline" className="w-4 h-4 text-default-400" />}
        />
      </div>

      <div className="border border-divider rounded-xl overflow-hidden mb-4">
        {/* Select all header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-content2 border-b border-divider">
          <Checkbox
            isSelected={selected.size === rows.filter((r) => r.status !== "skip").length}
            isIndeterminate={selected.size > 0 && selected.size < rows.filter((r) => r.status !== "skip").length}
            onChange={toggleAll}
            size="sm"
          />
          <span className="text-xs text-default-500">
            {selected.size} of {rows.length} selected
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-divider max-h-[480px] overflow-y-auto">
          {filtered.map((row) => {
            const badge = STATUS_BADGE[row.status];
            const isSelected = selected.has(row.id);
            return (
              <div
                key={row.id}
                className={`flex items-center gap-3 px-4 py-3 transition-opacity ${
                  !isSelected && row.status !== "skip" ? "opacity-60" : ""
                } ${row.status === "skip" ? "opacity-40" : ""}`}
              >
                <Checkbox
                  isSelected={isSelected}
                  onChange={() => toggleRow(row.id)}
                  isDisabled={row.status === "skip" && !isSelected}
                  size="sm"
                />
                {row.sourceThumbnail ? (
                  <img src={row.sourceThumbnail} alt="" className="w-9 h-9 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded bg-content2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{row.title}</p>
                  <p className="text-xs text-default-400 truncate">
                    {row.category ?? "Unknown category"}
                    {row.sizeDisplay ? ` · ${row.sizeDisplay}` : ""}
                  </p>
                </div>
                <span className="text-sm text-foreground flex-shrink-0">
                  ${row.price.toFixed(2)}
                </span>

                {row.status === "fix_size" ? (
                  <Select
                    size="sm"
                    className="w-28 flex-shrink-0"
                    placeholder="Size system"
                    selectedKeys={sizeFixMap[row.id] ? [sizeFixMap[row.id]] : []}
                    onChange={(e) =>
                      setSizeFixMap((prev) => ({ ...prev, [row.id]: e.target.value as SizeSystem }))
                    }
                  >
                    {SIZE_SYSTEMS.map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>
                ) : (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0 ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-default-400">
          {fixCount > 0 && `${fixCount} need size fix · `}
          {skipCount > 0 && `${skipCount} skipped (unrecognised category)`}
        </p>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button
            color="primary"
            isDisabled={!canConfirm || loading}
            isLoading={loading}
            onPress={handleConfirm}
            startContent={!loading && <Icon icon="solar:import-outline" className="w-4 h-4" />}
          >
            {loading ? "Importing..." : `Import ${readyCount} products`}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/organizations/import/review-table.tsx
git commit -m "feat: add ImportReviewTable component with selection, size fix, and confirm"
```

---

## Task 19: ImportSuccessScreen Component

**Files:**
- Create: `components/dashboard/organizations/import/success-screen.tsx`

- [ ] **Step 1: Create success-screen.tsx**

```tsx
"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

interface Props {
  count: number;
  onImportMore: () => void;
}

export default function ImportSuccessScreen({ count, onImportMore }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mb-6">
        <Icon icon="solar:check-circle-bold" className="w-8 h-8 text-success-600" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        {count} {count === 1 ? "product" : "products"} imported
      </h2>
      <p className="text-sm text-default-500 mb-8 max-w-sm">
        They're live in your listings as drafts. Review and publish them when you're ready.
      </p>
      <div className="flex gap-3">
        <Button variant="flat" onPress={onImportMore}>
          Import more
        </Button>
        <Button
          color="primary"
          endContent={<Icon icon="solar:arrow-right-outline" className="w-4 h-4" />}
          onPress={() => router.push("/dashboard/organization/listings")}
        >
          Go to Listings
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/organizations/import/success-screen.tsx
git commit -m "feat: add ImportSuccessScreen component"
```

---

## Task 20: End-to-End Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: CSV import path**

1. Navigate to `/dashboard/organization/listings`
2. Click "Import" — should go to `/dashboard/organization/import`
3. Download the MDFLD template (click "Download template")
4. Fill in 2–3 rows in the CSV
5. Drag the file onto the drop zone
6. Confirm the review table appears with correct status badges
7. Select rows and click "Import N products"
8. Confirm success screen shows
9. Navigate to Listings — confirm imported products appear as drafts (`isActive: false`)

- [ ] **Step 3: Sidebar nav**

Confirm "Import" appears in the sidebar and navigates correctly.

- [ ] **Step 4: Error paths**

- Upload a CSV over 5 MB — confirm error message appears
- Upload a CSV where all rows have unrecognised categories — confirm all are Skip status

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete bulk product import feature"
```
