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
