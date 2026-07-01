# Collectibles & Football Category System — Design Spec

## Overview

MDFLD currently treats all product categories with the same listing fields, condition scale, and search filters. This spec introduces category-aware logic that renders different forms, condition scales, and filters based on which category group a product belongs to.

Three category groups are defined in code:
- **WEARABLE** — existing behaviour, no changes
- **COLLECTIBLE** — stickers, trading cards (and future: figurines, memorabilia)
- **FOOTBALL** — footballs, with their own size/grade/condition system

---

## Category Structure Changes

### New top-level category
`COLLECTIBLES` is added to the `ProductCategory` enum.

### STICKERS and TRADING_CARDS demoted
`STICKERS` and `TRADING_CARDS` are removed from `ProductCategory` and added as `ProductSubcategory` values under `COLLECTIBLES`.

### FOOTBALLS unchanged
`FOOTBALLS` remains a top-level `ProductCategory` but adopts new listing fields.

### Category group constant
A new `CATEGORY_GROUP` map in `lib/constants/product-categories.ts` drives form, filter, and display logic:

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
```

### Data migration
Existing products with `category = STICKERS` → `category = COLLECTIBLES`, `subcategory = STICKERS`.
Existing products with `category = TRADING_CARDS` → `category = COLLECTIBLES`, `subcategory = TRADING_CARDS`.

---

## Schema Changes

### New enum: `BallGrade`
```prisma
enum BallGrade {
  PRO_MATCH    // FIFA Quality Pro — World Cup, Champions League, top leagues
  COMPETITION  // FIFA Quality Pro certified — semi-pro / cup level
  LEAGUE       // FIFA approved — official matches
  TRAINING     // High-frequency durable use
  CLUB         // Recreational / beginner
  MINI_SKILLS  // Size 1–2 skills balls
}
```

### Extended `ProductCondition` enum
New values added for collectible grading (existing wearable values unchanged):
```prisma
MINT
NEAR_MINT
EXCELLENT
GOOD        // collector grade — distinct from USED_GOOD
FAIR        // collector grade — distinct from USED_FAIR
POOR
```

Football listings reuse existing wearable condition values with relabelled display text:
| Enum value | Football display label |
|---|---|
| `BRAND_NEW` | New in Box |
| `NEW_WITHOUT_TAGS` | New Without Box |
| `USED_LIKE_NEW` | Used — Like New |
| `USED_GOOD` | Used — Good |
| `USED_FAIR` | Used — Fair |

### New nullable fields on `Product`
All fields are nullable — only populated for the relevant category group:

```prisma
// Collectible fields (COLLECTIBLES category)
collectibleCode       String?   // free text, e.g. KOR14
setName               String?   // e.g. FIFA World Cup 2026
collectiblePublisher  String?   // e.g. Panini, Topps
collectiblePlayerName String?   // player featured
collectibleTeam       String?   // team or country
isPeeled              Boolean?  // stickers only: peeled from album

// Football fields (FOOTBALLS category)
ballSize              Int?      // 1–5 (FIFA standard)
ballGrade             BallGrade?
```

### Future extension (not in this spec)
`collectibleRarity String?` — deferred until there is enough catalogue data to know which publishers use which tier naming conventions (Base, Gold, Diamond, etc.). Will be free text when added, then structured per publisher.

---

## Upload / Listing Form

The product creation wizard reads `getCategoryGroup(category)` and renders the appropriate field set.

### WEARABLE
No changes from current behaviour.

### COLLECTIBLE
Fields shown:
- Subcategory (required): Stickers / Trading Cards
- Condition: Mint / Near Mint / Excellent / Good / Fair / Poor
- "Peeled?" toggle — shown only when subcategory is STICKERS
- Code (free text placeholder: "e.g. KOR14")
- Set name (free text placeholder: "e.g. FIFA World Cup 2026")
- Publisher (free text placeholder: "e.g. Panini")
- Player name
- Team / Country

Fields hidden: size, material, soleplate type, player version, tier.

### FOOTBALL
Fields shown:
- Ball size: 1 / 2 / 3 / 4 / 5 (inline label: "Size 5 — Full size / Ages 13+", etc.)
- Ball grade: Pro/Match / Competition / League / Training / Club / Mini/Skills
- Condition: New in Box / New Without Box / Used — Like New / Used — Good / Used — Fair
- Brand and year remain visible

Fields hidden: clothing size, material, soleplate, player version.

**Ball size inline labels:**
| Size | Label |
|---|---|
| 1 | Mini / Skills / Promo |
| 2 | Skills / Ages 3–5 |
| 3 | Youth / Ages 5–8 |
| 4 | Youth / Ages 8–12 |
| 5 | Full size / Ages 13+ / Professional |

---

## Search & Filters

The filter sidebar reads `getCategoryGroup(activeCategory)` and renders accordingly.

### WEARABLE categories
No changes from current behaviour.

### COLLECTIBLES
Filters shown:
- Subcategory: Stickers / Trading Cards
- Condition: Mint / Near Mint / Excellent / Good / Fair / Poor
- Peeled toggle (shown when Stickers subcategory active)
- Set name (text search)
- Publisher (text search)
- Player name (text search)
- Team / Country (text search)
- Code (text search, e.g. KOR14)

Standard filters hidden: clothing size, material, soleplate.

### FOOTBALLS
Filters shown:
- Ball size: 1 / 2 / 3 / 4 / 5
- Ball grade: Pro/Match / Competition / League / Training / Club / Mini/Skills
- Condition: New in Box / New Without Box / Used — Like New / Used — Good / Used — Fair

Standard filters hidden: clothing size, material.

---

## Listing Display (Product Detail Page)

### WEARABLE
No changes.

### COLLECTIBLE
- Condition badge uses collector grading labels (Mint, Near Mint, etc.)
- "Peeled" badge shown prominently if `isPeeled` is true (stickers only)
- Attributes section shows only populated fields from: Code, Set, Publisher, Player, Team
- Wearable attributes (size, material, soleplate) hidden
- Future: `collectibleRarity` renders as a coloured badge (Gold, Diamond, etc.) when the field is added

### FOOTBALL
- Attributes section shows: Size (with inline label), Grade, Condition
- Condition renders with football-specific display labels (not wearable labels)
- Wearable attributes hidden

---

## Migration

Single Prisma migration:
1. Add `COLLECTIBLES` to `ProductCategory` enum
2. Add `STICKERS`, `TRADING_CARDS` to `ProductSubcategory` enum
3. Add `BallGrade` enum
4. Add `MINT`, `NEAR_MINT`, `EXCELLENT`, `GOOD`, `FAIR`, `POOR` to `ProductCondition` enum
5. Add nullable fields to `Product`: `collectibleCode`, `setName`, `collectiblePublisher`, `collectiblePlayerName`, `collectibleTeam`, `isPeeled`, `ballSize`, `ballGrade`
6. Data migration: update existing STICKERS products → `category = COLLECTIBLES`, `subcategory = STICKERS`; update existing TRADING_CARDS products → `category = COLLECTIBLES`, `subcategory = TRADING_CARDS`
7. Remove `STICKERS` and `TRADING_CARDS` from `ProductCategory` enum (after data migration confirms zero rows with old values)

---

## Files Affected

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add BallGrade enum, extend ProductCondition, extend ProductCategory/SubCategory, add nullable fields to Product |
| `lib/constants/product-categories.ts` | Add COLLECTIBLES, CATEGORY_GROUPS map, getCategoryGroup() helper |
| `app/(dashboard)/dashboard/listings/new/` | Wizard reads getCategoryGroup, renders category-aware fields |
| `app/(main)/products/products-page-client.tsx` | Filter sidebar reads getCategoryGroup |
| `app/(main)/products/[id]/` | Display reads getCategoryGroup, renders category-aware attributes |
| `server/routers/product.ts` | Search procedure accepts new collectible/football filter params |
| `__tests__/` | Tests for getCategoryGroup helper, form rendering per group, filter logic |
