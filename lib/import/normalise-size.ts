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
