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
