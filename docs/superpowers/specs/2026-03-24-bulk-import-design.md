# Bulk Product Import — Design Spec
**Date:** 2026-03-24
**Project:** MDFLD
**Status:** Approved

---

## Overview

A bulk import feature that lets sellers onboard their existing inventory onto MDFLD from marketplaces (Shopify, eBay), resale platforms (Depop, Vinted), website builders (Wix, WooCommerce, GoDaddy), and social/informal channels (Instagram, WhatsApp). The feature lives inside the seller dashboard with two entry points and routes to a dedicated import page.

---

## Entry Points

Two ways to reach `/dashboard/import`:

1. **Listings page header** — an `Import` button sits next to `+ Add Product` in the top-right action bar of the My Listings page (`/dashboard/organization/listings`)
2. **Sidebar nav** — an `Import` item under the Store section in the seller sidebar, rendered with an upload arrow icon (Lucide `Upload`)

Both entry points are always visible — not just for new sellers with zero products.

---

## Import Page (`/dashboard/import`)

An onboarding-style page with a two-track layout and a CSV drop zone.

### Track 1 — Marketplace or Store

A grid of platform cards. Each card shows the platform's brand logo/icon, name, and a badge indicating the integration type.

**Direct API integrations (OAuth):**
- Shopify — `API` badge (green)
- eBay — `API` badge (green)

**Step-by-step export guides:**
- Depop — `Guide` badge (grey)
- Vinted — `Guide` badge (grey)
- Wix — `Guide` badge (grey)
- WooCommerce — `Guide` badge (grey)
- GoDaddy — `Guide` badge (grey)
- `More platforms` overflow card (dashed border) for future additions

Clicking an **API card** initiates the OAuth flow for that platform.
Clicking a **Guide card** opens an in-page walkthrough — numbered steps explaining how to export from that platform, ending with a CSV upload button.

### Track 2 — Social or Informal

For sellers on Instagram, WhatsApp, or with no structured storefront.

- Descriptive copy: "Selling on Instagram, WhatsApp, or without a proper storefront? We'll walk you through adding your products directly."
- **Download template** button (primary) — downloads the MDFLD CSV template
- **Add products one by one** button (secondary) — links to the existing `/dashboard/organization/listings` product creation flow

### CSV Drop Zone

Always visible below both tracks. Accepts CSV files from any platform. Copy: "Drag & drop any CSV export here — we'll detect the format and map it to MDFLD automatically." Includes a "browse file" link as a fallback.

---

## Selection & Review Screen

Shown after an OAuth connect completes or a CSV is uploaded/parsed.

### Layout

A full-page table with:
- **Search** input — filter by product name
- **Filter** dropdown — filter by category
- **Selection count** — e.g. "142 of 247 selected" (top right)
- **Select all** row at the top of the table

### Table Columns

| Column | Description |
|---|---|
| Checkbox | Select/deselect individual rows |
| Thumbnail | Product image (if available from source) |
| Title | Product name from source platform |
| Category | Mapped MDFLD category |
| Size | Normalised size value + system |
| Price | Price from source |
| Status badge | Ready / Fix size / Skip |

### Status Badges

- **Ready** (green) — product maps cleanly to MDFLD schema, no action needed
- **Fix size** (amber) — size format could not be automatically normalised (e.g. `"10.5"`, `"Size M"`) — seller must select the correct size system before confirming
- **Skip** (red) — category unrecognised or product missing required fields — deselected by default, seller can re-select and fix manually

### Bottom Action Bar

- Left: issues summary — e.g. "5 items need review · 3 skipped (unrecognised category)"
- Right: `Import N products →` primary button — disabled until at least one row is selected

### After Confirm

- Selected products are created as draft records (`isActive: false`) in the DB
- Seller is shown a success screen: "N products imported — they're live in your listings as drafts. Review and publish when ready."
- Two CTAs: `Import more` and `Go to Listings →`

---

## Backend

### API Routes

All routes under `/api/products/bulk-import/`. Auth via `auth.api.getSession` on all routes except `template` (public download).

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/products/bulk-import/template` | Download MDFLD CSV template file |
| `POST` | `/api/products/bulk-import/parse` | Accept CSV upload, parse + validate rows, return preview payload |
| `POST` | `/api/products/bulk-import/confirm` | Accept selected rows (JSON), create draft products in DB |
| `GET` | `/api/products/bulk-import/shopify/connect` | Generate Shopify OAuth authorisation URL, redirect |
| `GET` | `/api/products/bulk-import/shopify/callback` | Handle OAuth callback, store token, fetch listings, return preview payload |
| `GET` | `/api/products/bulk-import/ebay/connect` | Generate eBay OAuth authorisation URL, redirect |
| `GET` | `/api/products/bulk-import/ebay/callback` | Handle OAuth callback, store token, fetch listings, return preview payload |

### Data Flow

1. **OAuth connect** — seller clicks Shopify/eBay card → redirected to platform OAuth → callback stores access token on `SellerProfile` → listings fetched via platform API → normalised into preview rows → stored in server-side session (not DB)
2. **CSV upload** — file sent to `/parse` → rows parsed, validated, normalised → preview rows returned in response (not stored server-side — client holds state)
3. **Confirm** — client sends selected + fixed rows to `/confirm` → products created in DB as drafts via `prisma.product.create` (same logic as existing `product.create` TRPC procedure, without Stripe product creation) → response returns count of created products

### Schema Mapping & Normalisation

**Sizes:**
Free-form size strings from external platforms (e.g. `"US 10"`, `"10.5"`, `"43 EU"`, `"M"`) are normalised to MDFLD's `SizeSystem` enum + `sizeValue`. Unrecognisable formats are flagged as `Fix size`.

**Categories:**
Source categories are fuzzy-matched to MDFLD's `ProductCategory` enum (BOOTS, JERSEYS, FOOTBALLS, TRADING_CARDS, GOALKEEPER_GLOVES, SHIN_GUARDS, TRAINING_EQUIPMENT, ACCESSORIES). No match → `Skip` status.

**Conditions:**
Platform condition labels (e.g. Depop's `"Like New"`, eBay's `"New with tags"`) are mapped to `ProductCondition` enum. Unmapped → defaults to `USED_GOOD`.

**OAuth tokens:**
Stored as fields on `SellerProfile` (e.g. `shopifyAccessToken`, `ebayAccessToken`). Schema migration required.

**Draft products:**
All imported products are created with `isActive: false`. No Stripe product/price creation at import time — that happens when the seller publishes the listing.

---

## CSV Template

The downloadable template includes the following columns:

`title`, `description`, `price`, `compare_at_price`, `category`, `subcategory`, `brand`, `condition`, `images` (comma-separated URLs), `tags` (comma-separated), `sku`, `inventory`, `has_variants`, `variant_size_value`, `variant_size_system`, `variant_price`, `variant_inventory`, `variant_sku`, `variant_color`

For products with variants: repeat the title on each row for each size/colour. Leave product-level fields blank on rows 2+. Rows with the same title are grouped into one product.

The template file includes comment rows at the top listing valid values for `category`, `condition`, and `variant_size_system`, plus two example products (one simple, one with variants).

---

## Frontend Components

| Component | Location | Purpose |
|---|---|---|
| Import page | `app/(dashboard)/dashboard/import/page.tsx` | Route page, renders the two-track layout |
| `ImportPlatformGrid` | `components/dashboard/organizations/import/platform-grid.tsx` | Platform cards grid with brand icons and badges |
| `ImportSocialTrack` | `components/dashboard/organizations/import/social-track.tsx` | Social/informal track with template download |
| `ImportCsvDropZone` | `components/dashboard/organizations/import/csv-drop-zone.tsx` | Drag-and-drop CSV upload zone |
| `ImportReviewTable` | `components/dashboard/organizations/import/review-table.tsx` | Selection + review table with status badges |
| `ImportSuccessScreen` | `components/dashboard/organizations/import/success-screen.tsx` | Post-confirm success state |

---

## Out of Scope (this version)

- Automatic sync / re-import on schedule (one-time import only for now)
- Etsy, Grailed, StockX integrations
- Image re-hosting (imported image URLs are stored as-is, not re-uploaded to MDFLD storage)
- Duplicate detection across imports
