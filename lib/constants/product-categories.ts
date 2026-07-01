export const PRODUCT_CATEGORIES = {
  JERSEYS: "JERSEYS",
  BOOTS: "BOOTS",
  FOOTBALLS: "FOOTBALLS",
  COLLECTIBLES: "COLLECTIBLES",
  GOALKEEPER_GLOVES: "GOALKEEPER_GLOVES",
  SHIN_GUARDS: "SHIN_GUARDS",
  TRAINING_EQUIPMENT: "TRAINING_EQUIPMENT",
  ACCESSORIES: "ACCESSORIES",
} as const;

export type ProductCategoryType =
  (typeof PRODUCT_CATEGORIES)[keyof typeof PRODUCT_CATEGORIES];

// Popular brands for the marketplace
export const POPULAR_BRANDS = [
  "Nike",
  "Adidas",
  "Jordan",
  "Yeezy",
  "Supreme",
  "Off-White",
  "Balenciaga",
  "Louis Vuitton",
  "Gucci",
  "Prada",
  "Dior",
  "Hermès",
  "Rolex",
  "Audemars Piguet",
  "Patek Philippe",
  "Cartier",
  "Chrome Hearts",
  "Rick Owens",
  "Fear of God",
  "Stone Island",
  "Moncler",
  "Canada Goose",
  "The North Face",
  "Arc'teryx",
  "BAPE",
  "Palace",
  "Stüssy",
  "Kith",
  "Comme des Garçons",
  "Acne Studios",
];

// Size ranges for different product types
export const SIZE_RANGES = {
  SHOES_US_MEN: [
    "4",
    "4.5",
    "5",
    "5.5",
    "6",
    "6.5",
    "7",
    "7.5",
    "8",
    "8.5",
    "9",
    "9.5",
    "10",
    "10.5",
    "11",
    "11.5",
    "12",
    "12.5",
    "13",
    "14",
    "15",
  ],
  SHOES_US_WOMEN: [
    "5",
    "5.5",
    "6",
    "6.5",
    "7",
    "7.5",
    "8",
    "8.5",
    "9",
    "9.5",
    "10",
    "10.5",
    "11",
    "11.5",
    "12",
  ],
  CLOTHING: ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  CLOTHING_NUMERIC: [
    "36",
    "38",
    "40",
    "42",
    "44",
    "46",
    "48",
    "50",
    "52",
    "54",
    "56",
  ],
  RING_SIZES: [
    "3",
    "3.5",
    "4",
    "4.5",
    "5",
    "5.5",
    "6",
    "6.5",
    "7",
    "7.5",
    "8",
    "8.5",
    "9",
    "9.5",
    "10",
    "10.5",
    "11",
    "11.5",
    "12",
    "12.5",
    "13",
  ],
  WATCH_SIZES: [
    "36mm",
    "38mm",
    "40mm",
    "41mm",
    "42mm",
    "44mm",
    "45mm",
    "46mm",
    "47mm",
    "48mm",
  ],
};

// Authentication methods
export const AUTHENTICATION_METHODS = [
  "In-house authentication",
  "Brand authentication",
  "Third-party authentication (e.g., StockX, GOAT)",
  "Receipt/proof of purchase",
  "Serial number verification",
];

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

export const WEARABLE_CONDITIONS = [
  { key: 'BRAND_NEW', label: 'Brand New' },
  { key: 'NEW_WITH_TAGS', label: 'New with Tags' },
  { key: 'NEW_WITHOUT_TAGS', label: 'New without Tags' },
  { key: 'USED_LIKE_NEW', label: 'Used - Like New' },
  { key: 'USED_GOOD', label: 'Used - Good' },
  { key: 'USED_FAIR', label: 'Used - Fair' },
];

export const COLLECTIBLE_CONDITIONS = [
  { key: 'MINT', label: 'Mint' },
  { key: 'NEAR_MINT', label: 'Near Mint' },
  { key: 'EXCELLENT', label: 'Excellent' },
  { key: 'GOOD', label: 'Good' },
  { key: 'FAIR', label: 'Fair' },
  { key: 'POOR', label: 'Poor' },
];

export const FOOTBALL_CONDITION_LABELS: Record<string, string> = {
  BRAND_NEW: 'New in Box',
  NEW_WITHOUT_TAGS: 'New Without Box',
  USED_LIKE_NEW: 'Used - Like New',
  USED_GOOD: 'Used - Good',
  USED_FAIR: 'Used - Fair',
};

export const FOOTBALL_CONDITIONS = [
  { key: 'BRAND_NEW', label: 'New in Box' },
  { key: 'NEW_WITHOUT_TAGS', label: 'New Without Box' },
  { key: 'USED_LIKE_NEW', label: 'Used - Like New' },
  { key: 'USED_GOOD', label: 'Used - Good' },
  { key: 'USED_FAIR', label: 'Used - Fair' },
];

export const BALL_GRADES = [
  { key: 'PRO_MATCH', label: 'Pro / Match' },
  { key: 'COMPETITION', label: 'Competition' },
  { key: 'LEAGUE', label: 'League' },
  { key: 'TRAINING', label: 'Training' },
  { key: 'CLUB', label: 'Club' },
  { key: 'MINI_SKILLS', label: 'Mini / Skills' },
];

export const BALL_SIZE_LABELS: Record<number, string> = {
  1: 'Mini / Skills / Promo',
  2: 'Skills / Ages 3-5',
  3: 'Youth / Ages 5-8',
  4: 'Youth / Ages 8-12',
  5: 'Full size / Ages 13+ / Professional',
};

export const COLLECTIBLE_SUBCATEGORIES = [
  { key: 'STICKERS', label: 'Stickers' },
  { key: 'TRADING_CARDS', label: 'Trading Cards' },
];
