# Bulk Product Import — Design Spec
**Date:** 2026-03-24
**Project:** MDFLD
**Status:** Approved (rev 3)

---

## Overview

A bulk import feature that lets sellers onboard their existing inventory onto MDFLD from marketplaces (Shopify, eBay), resale platforms (Depop, Vinted), website builders (Wix, WooCommerce, GoDaddy), and social/informal channels (Instagram, WhatsApp). The feature lives inside the seller dashboard with two entry points and routes to a dedicated import page.

---

## Entry Points

Two ways to reach `/dashboard/organization/import`:

1. **Listings page header** — an `Import` button sits next to `+ Add Product` in the top-right action bar of the My Listings page (`/dashboard/organization/listings`)
2. **Sidebar nav** — an `Import` item under the Store section in the seller sidebar, rendered with Iconify icon `solar:upload-outline` (matching the existing `solar:*` namespace used throughout `sidebar-items.tsx`)

Both entry points are always visible — not just for new sellers with zero products.

---

## Import Page (`/dashboard/organization/import`)

Route lives at `app/(dashboard)/dashboard/organization/import/page.tsx`. Applies the same client-side organisation guard pattern as `/dashboard/organization/listings/page.tsx` — uses `useOrganizationStore`, `useSession`, and `useEffect` to check for an active organisation and an `owner` or `admin` role, rendering an inline access-denied message rather than a server-side redirect. The `sellerProfileId` is always derived server-side from the authenticated session — it is never accepted from the client.

An onboarding-style page with a two-track layout and a CSV drop zone.

### Track 1 — Marketplace or Store

A grid of platform cards. Each card shows the platform's brand logo/icon (inline SVG — no emoji), name, and a badge indicating the integration type.

**Direct API integrations (OAuth):**
- Shopify — `API` badge (green)
- eBay — `API` badge (green)

**Step-by-step export guides:**
- Depop — `Guide` badge (grey)
- Vinted — `Guide` badge (grey)
- Wix — `Guide` badge (grey)
- WooCommerce — `Guide` badge (grey)
- GoDaddy — `Guide` badge (grey)
- `More platforms` overflow card (dashed border) — clicking opens a contact/request form for sellers to suggest a platform; no integration behind it in this version

Clicking an **API card** initiates the OAuth flow for that platform (see OAuth flow below).
Clicking a **Guide card** opens an in-page walkthrough — numbered steps explaining how to export from that platform, ending with a CSV upload button. Guide content (copy + steps) is hardcoded per platform. If guide content is not yet written for a platform at implementation time, render a placeholder with the steps listed as TODOs.

### Track 2 — Social or Informal

For sellers on Instagram, WhatsApp, or with no structured storefront.

- Descriptive copy: "Selling on Instagram, WhatsApp, or without a proper storefront? We'll walk you through adding your products directly."
- **Download template** button (primary) — hits `GET /api/products/bulk-import/template`
- **Add products one by one** button (secondary) — links to `/dashboard/organization/listings` product creation flow

### CSV Drop Zone

Always visible below both tracks. Accepts CSV files. Hard limits: **5 MB max file size, 5,000 rows max**. If either limit is exceeded, show an inline error before upload. Copy: "Drag & drop any CSV export here — we'll detect the format and map it to MDFLD automatically." Includes a "browse file" link as a fallback.

CSV cells beginning with `=`, `+`, `-`, or `@` are sanitised on parse (prefixed with a single quote) to prevent formula injection when sellers open exports in Excel or LibreOffice.

---

## OAuth Flow (Shopify & eBay)

### Connect

1. Seller clicks the Shopify or eBay card
2. Client navigates to `GET /api/products/bulk-import/shopify/connect` (or `/ebay/connect`)
3. Server calls `auth.api.getSession` to identify the seller, generates a cryptographically random `state` value (using `crypto.randomUUID()`), stores it in a short-lived HTTP-only cookie (`import_oauth_state`, `maxAge: 600`), and redirects the browser to the platform's OAuth consent page with the `state` parameter included in the URL

### Callback & State Passing

The OAuth callback is a `GET` redirect — it cannot return JSON to the client directly. The solution:

1. Callback handler (`/shopify/callback` or `/ebay/callback`) reads the `state` query param and validates it against the `import_oauth_state` cookie — if they do not match or the cookie is absent, return 400 and abort. The handler then calls `auth.api.getSession` (the seller's session cookie is present in the redirect) to identify which seller to associate the tokens with. The `import_oauth_state` cookie is cleared after validation.
2. Handler exchanges the auth code for tokens, stores tokens on `SellerProfile` (see migration below), then fetches the seller's listings from the platform API
2. Normalised preview rows are written to a new `ImportSession` Prisma model (see migration) with a generated `sessionId` (cuid) and a TTL of 30 minutes
3. Callback redirects to `/dashboard/organization/import?session=<sessionId>`
4. The import page reads the `session` query param on load, calls `GET /api/products/bulk-import/session?id=<sessionId>` to fetch the preview rows, then renders the review table
5. After confirm or after TTL expiry, the `ImportSession` record is deleted

### Environment Variables Required

```
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
SHOPIFY_REDIRECT_URI=https://<domain>/api/products/bulk-import/shopify/callback
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_REDIRECT_URI=https://<domain>/api/products/bulk-import/ebay/callback
```

Required Shopify scope: `read_products`
Required eBay scope: `https://api.ebay.com/oauth/api_scope/sell.inventory.readonly`

---

## Selection & Review Screen

Shown after an OAuth connect completes (via `?session=` param) or a CSV is uploaded and parsed (client holds state in React state — no server storage needed for CSV path).

### Layout

A full-page table with:
- **Search** input — filter by product name
- **Filter** dropdown — filter by category
- **Selection count** — e.g. "142 of 247 selected" (top right)
- **Select all** checkbox row at the top of the table

### Table Columns

| Column | Description |
|---|---|
| Checkbox | Select/deselect individual rows |
| Thumbnail | Product image (first URL if available; blank placeholder if none) |
| Title | Product name from source platform |
| Category | Mapped MDFLD category |
| Size | Normalised `sizeDisplay` string |
| Price | Price from source |
| Status badge | Ready / Fix size / Skip |

### Status Badges

- **Ready** (green) — product maps cleanly to MDFLD schema
- **Fix size** (amber) — size format could not be automatically normalised — seller selects size system from an inline dropdown before confirming
- **Skip** (red) — category unrecognised or required field missing — deselected by default; seller can re-select and manually fix

### Bottom Action Bar

- Left: issues summary — e.g. "5 items need review · 3 skipped (unrecognised category)"
- Right: `Import N products →` primary button — disabled until at least one **Ready** row is selected (rows in `Fix size` state that have not been resolved do not count)

### Loading State

While `/confirm` is in flight (can take several seconds for large batches), show a full-width progress indicator with copy: "Importing N products..." — button is disabled and spinner shown.

### Error Screen

If `/confirm` fails partway through, the entire transaction is rolled back (all creates wrapped in `prisma.$transaction`). Show: "Something went wrong — no products were imported. Your listings are unchanged." with a `Try again` button that returns to the review table with selections preserved.

### After Confirm

- Selected products created as draft records (`isActive: false`)
- `ImportSession` record deleted
- Success screen: "N products imported — they're live in your listings as drafts. Review and publish when ready."
- Two CTAs: `Import more` (resets page) and `Go to Listings →`

---

## Backend

### API Routes

All routes under `/api/products/bulk-import/`. Auth via `auth.api.getSession` on all routes except `template` (public download).

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/products/bulk-import/template` | Download MDFLD CSV template file |
| `GET` | `/api/products/bulk-import/session` | Fetch preview rows from ImportSession by `?id=` |
| `POST` | `/api/products/bulk-import/parse` | Accept CSV upload (max 5 MB / 5,000 rows), parse + validate, return preview rows |
| `POST` | `/api/products/bulk-import/confirm` | Accept selected rows (JSON), create draft products in a single transaction |
| `GET` | `/api/products/bulk-import/shopify/connect` | Generate Shopify OAuth URL, redirect |
| `GET` | `/api/products/bulk-import/shopify/callback` | Exchange code, store tokens, fetch listings, write ImportSession, redirect |
| `GET` | `/api/products/bulk-import/ebay/connect` | Generate eBay OAuth URL, redirect |
| `GET` | `/api/products/bulk-import/ebay/callback` | Exchange code, store tokens, fetch listings, write ImportSession, redirect |

### Confirm Input

The `/confirm` endpoint accepts a JSON body of the shape:
```ts
{
  rows: Array<{
    title: string
    description?: string
    price: number
    category: ProductCategory
    condition: ProductCondition
    brand?: string
    sku?: string
    inventory: number
    images: string[]
    tags: string[]
    hasVariants: boolean
    variants?: Array<{
      sizeValue: string
      sizeSystem: SizeSystem
      price: number
      inventory: number
      sku?: string
      color?: string
    }>
  }>
}
```

Maximum 5,000 rows per call. Requests exceeding this are rejected with HTTP 400 before any DB writes occur.

### Confirm Idempotency

The `/confirm` endpoint checks for SKU conflicts before writing:
- If a row has a non-empty `sku` that already exists for this seller in the DB, that row is skipped (not errored)
- All other rows are created inside a single `prisma.$transaction` — if any create fails, the entire batch is rolled back
- Response includes: `{ created: N, skipped: N, reason: "duplicate_sku" }`

---

## Schema Mapping & Normalisation

### Sizes

Free-form strings (e.g. `"US 10"`, `"10.5"`, `"43 EU"`, `"M"`) are normalised as follows:

1. Attempt regex match against known patterns per `SizeSystem`
2. On match: set `sizeValue` (the numeric/string value), `sizeSystem` (the enum), and `sizeDisplay` (formatted as `"${sizeSystem} ${sizeValue}"`, e.g. `"UK 9"`)
3. No match → flag as `Fix size`; seller chooses `sizeSystem` from an inline dropdown; `sizeDisplay` is computed on selection

`sizeDisplay` is always computed server-side at confirm time as `"${sizeSystem} ${sizeValue}"` — never accepted from client.

**Lookup patterns (examples):**
- `"US 10"`, `"US10"`, `"10 US"` → `{ sizeSystem: "US", sizeValue: "10" }`
- `"UK 9"`, `"UK9"` → `{ sizeSystem: "UK", sizeValue: "9" }`
- `"EU 43"`, `"43"` (numeric 35–50 range) → `{ sizeSystem: "EU", sizeValue: "43" }`
- `"S"`, `"M"`, `"L"`, `"XL"`, `"XXL"` → `{ sizeSystem: "STANDARD", sizeValue: "M" }`
- `"One Size"`, `"OS"` → `{ sizeSystem: "ONE_SIZE", sizeValue: "ONE_SIZE" }`

### Categories

Per-platform keyword lookup table (not generic fuzzy match):

| Source string (case-insensitive) | MDFLD category |
|---|---|
| boot, cleat, shoe, footwear | `BOOTS` |
| jersey, shirt, kit, top | `JERSEYS` |
| ball, football, soccer ball | `FOOTBALLS` |
| card, trading card, panini | `TRADING_CARDS` |
| glove, goalkeeper | `GOALKEEPER_GLOVES` |
| shin guard, shin pad | `SHIN_GUARDS` |
| training, gym, exercise | `TRAINING_EQUIPMENT` |
| anything else | → `Skip` |

`subcategory` is always left null at import time — too platform-specific to map reliably.

### Conditions

| Source label | MDFLD `ProductCondition` |
|---|---|
| Brand new, BNIB | `BRAND_NEW` |
| New with tags, BNWT | `NEW_WITH_TAGS` |
| New without tags, BNWOB | `NEW_WITHOUT_TAGS` |
| Like new, Excellent, Near mint | `USED_LIKE_NEW` |
| Good, Very good | `USED_GOOD` |
| Fair, Acceptable, Poor | `USED_FAIR` |
| Anything unmapped | `USED_GOOD` (default) |

### Descriptions

If the source platform provides no description, `title` is used as the `description` fallback. This ensures the non-nullable `Product.description` field is always populated.

### Images

`images` is stored as-is (array of URL strings). Empty arrays are allowed (`images: []`) — the listings UI handles missing images gracefully with a placeholder. No URL validation beyond confirming each entry is a non-empty string (the strict `.url()` check from the TRPC procedure is relaxed for imports, since platform URLs may not pass standard URL validation).

### Draft Products

All imported products: `isActive: false`. No Stripe product/price creation at import — happens when seller publishes.

---

## Prisma Migration

Add to `SellerProfile`:

```prisma
// Shopify OAuth
shopifyAccessToken  String?
shopifyShopDomain   String?   // Required to make Shopify API calls (token is shop-scoped)
shopifyTokenExpiresAt DateTime?

// eBay OAuth
ebayAccessToken     String?
ebayRefreshToken    String?
ebayTokenExpiresAt  DateTime?
```

Add new model:

```prisma
model ImportSession {
  id        String   @id @default(cuid())
  sellerId  String
  platform  String   // "shopify" | "ebay"
  rows      Json     // normalised preview rows array
  expiresAt DateTime
  createdAt DateTime @default(now())

  seller SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@index([sellerId])
  @@map("import_session")
}
```

Add relation on `SellerProfile`:
```prisma
importSessions ImportSession[]
```

---

## CSV Template

Columns: `title`, `description`, `price`, `compare_at_price`, `category`, `subcategory`, `brand`, `condition`, `images` (comma-separated URLs), `tags` (comma-separated), `sku`, `inventory`, `has_variants`, `variant_size_value`, `variant_size_system`, `variant_price`, `variant_inventory`, `variant_sku`, `variant_color`

For products with variants: repeat title on each row per size/colour variant. Leave product-level fields blank on rows 2+. Rows with the same title are grouped into one product.

Template includes comment rows listing valid values for `category`, `condition`, and `variant_size_system`, plus two example products (one simple, one with variants).

---

## Frontend Components

| Component | Location | Purpose |
|---|---|---|
| Import page | `app/(dashboard)/dashboard/organization/import/page.tsx` | Route page, org guard, renders two-track layout |
| `ImportPlatformGrid` | `components/dashboard/organizations/import/platform-grid.tsx` | Platform cards with inline SVG brand icons and badges |
| `ImportSocialTrack` | `components/dashboard/organizations/import/social-track.tsx` | Social/informal track with template download |
| `ImportCsvDropZone` | `components/dashboard/organizations/import/csv-drop-zone.tsx` | Drag-and-drop CSV upload with size/row validation |
| `ImportReviewTable` | `components/dashboard/organizations/import/review-table.tsx` | Selection table with status badges and inline size fix |
| `ImportSuccessScreen` | `components/dashboard/organizations/import/success-screen.tsx` | Post-confirm success state |

---

## Out of Scope (this version)

- Automatic sync / re-import on schedule (one-time import only)
- Etsy, Grailed, StockX integrations
- Image re-hosting (URLs stored as-is)
- Duplicate detection across multiple imports of the same platform
- Subcategory mapping
