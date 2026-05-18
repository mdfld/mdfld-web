import type { ProductCondition } from "@prisma/client";

// eBay Inventory API conditionEnum values
const EBAY_CODE_MAP: Record<string, ProductCondition> = {
  NEW: "BRAND_NEW",
  LIKE_NEW: "USED_LIKE_NEW",
  EXCELLENT_REFURBISHED: "USED_LIKE_NEW",
  VERY_GOOD_REFURBISHED: "USED_LIKE_NEW",
  GOOD_REFURBISHED: "USED_GOOD",
  SELLER_REFURBISHED: "USED_GOOD",
  USED_EXCELLENT: "USED_LIKE_NEW",
  USED_VERY_GOOD: "USED_GOOD",
  USED_GOOD: "USED_GOOD",
  USED_ACCEPTABLE: "USED_FAIR",
  FOR_PARTS_OR_NOT_WORKING: "USED_FAIR",
};

const KEYWORD_RULES: Array<{ keywords: string[]; condition: ProductCondition }> = [
  { keywords: ["brand new", "bnib"], condition: "BRAND_NEW" },
  { keywords: ["new with tags", "bnwt"], condition: "NEW_WITH_TAGS" },
  { keywords: ["new without tags", "bnwob"], condition: "NEW_WITHOUT_TAGS" },
  { keywords: ["like new", "excellent", "near mint"], condition: "USED_LIKE_NEW" },
  { keywords: ["very good", "good"], condition: "USED_GOOD" },
  { keywords: ["fair", "acceptable", "poor"], condition: "USED_FAIR" },
];

export function normaliseCondition(raw: string): ProductCondition {
  const upper = raw.toUpperCase().trim();
  if (EBAY_CODE_MAP[upper]) return EBAY_CODE_MAP[upper];

  const lower = raw.toLowerCase().trim();
  for (const { keywords, condition } of KEYWORD_RULES) {
    if (keywords.some((kw) => lower.includes(kw))) return condition;
  }
  return "USED_GOOD";
}
