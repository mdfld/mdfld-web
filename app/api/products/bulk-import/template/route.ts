import { NextResponse } from "next/server";

const TEMPLATE_HEADERS = [
  "title",
  "description",
  "price",
  "compare_at_price",
  "category",
  "subcategory",
  "brand",
  "condition",
  "images",
  "tags",
  "sku",
  "inventory",
  "has_variants",
  "variant_size_value",
  "variant_size_system",
  "variant_price",
  "variant_inventory",
  "variant_sku",
  "variant_color",
];

const EXAMPLE_ROWS = [
  // Simple product (no variants)
  [
    "Nike Mercurial Superfly 9 Elite",
    "Top-tier speed boot with a snug Flyknit upper",
    "199.99",
    "249.99",
    "BOOTS",
    "SOCCER_CLEATS",
    "Nike",
    "NEW_WITH_TAGS",
    "https://example.com/img1.jpg,https://example.com/img2.jpg",
    "nike,mercurial,speed",
    "NMS9E-BLK-10",
    "1",
    "false",
    "",
    "",
    "",
    "",
    "",
    "",
  ],
  // Product with variants - row 1 (first variant)
  [
    "Adidas Predator Accuracy.1 FG",
    "Control boot with Controlskin upper for precision passing",
    "229.99",
    "",
    "BOOTS",
    "SOCCER_CLEATS",
    "Adidas",
    "BRAND_NEW",
    "https://example.com/pred1.jpg",
    "adidas,predator,control",
    "",
    "",
    "true",
    "9",
    "UK",
    "229.99",
    "2",
    "PRED-ACC1-UK9",
    "Core Black",
  ],
  // Same product - row 2 (second variant, same title = same product)
  [
    "Adidas Predator Accuracy.1 FG",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "true",
    "10",
    "UK",
    "229.99",
    "3",
    "PRED-ACC1-UK10",
    "Core Black",
  ],
];

// Valid values for reference (appended as comments in the CSV)
const VALID_CATEGORIES =
  "BOOTS | JERSEYS | FOOTBALLS | TRADING_CARDS | GOALKEEPER_GLOVES | SHIN_GUARDS | TRAINING_EQUIPMENT | ACCESSORIES";
const VALID_CONDITIONS =
  "BRAND_NEW | NEW_WITH_TAGS | NEW_WITHOUT_TAGS | USED_LIKE_NEW | USED_GOOD | USED_FAIR";
const VALID_SIZE_SYSTEMS = "UK | US | EU | JP | CM | STANDARD | ONE_SIZE";

function csvRow(fields: string[]): string {
  return fields
    .map((f) => {
      if (f.includes(",") || f.includes('"') || f.includes("\n")) {
        return `"${f.replace(/"/g, '""')}"`;
      }
      return f;
    })
    .join(",");
}

export async function GET() {
  const lines: string[] = [
    `# MDFLD Bulk Import Template`,
    `# Valid categories: ${VALID_CATEGORIES}`,
    `# Valid conditions: ${VALID_CONDITIONS}`,
    `# Valid size systems: ${VALID_SIZE_SYSTEMS}`,
    `# For products with variants: repeat the title on each row for each size/variant. Leave product fields blank on rows 2+.`,
    `# Images: comma-separated URLs. Tags: comma-separated words.`,
    `#`,
    csvRow(TEMPLATE_HEADERS),
    ...EXAMPLE_ROWS.map(csvRow),
  ];

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="mdfld-import-template.csv"',
    },
  });
}
