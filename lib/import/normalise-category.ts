import type { ProductCategory } from "@prisma/client";

const RULES: Array<{ keywords: string[]; category: ProductCategory }> = [
  { keywords: ["boot", "cleat", "footwear", "shoe"], category: "BOOTS" },
  { keywords: ["jersey", "shirt", "kit", "top"], category: "JERSEYS" },
  { keywords: ["ball", "football", "soccer ball"], category: "FOOTBALLS" },
  { keywords: ["trading card", "card", "panini", "sticker"], category: "COLLECTIBLES" },
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
