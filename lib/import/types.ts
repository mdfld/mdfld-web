import type { ProductCategory, ProductCondition, SizeSystem } from "@prisma/client";

export type ImportRowStatus = "ready" | "fix_size" | "skip";

export interface ImportRow {
  // Identity
  id: string; // cuid generated at parse time, used as React key

  // Product fields
  title: string;
  description: string; // fallback to title if blank
  price: number;
  compareAtPrice?: number;
  category: ProductCategory | null;
  brand?: string;
  condition: ProductCondition;
  images: string[];
  tags: string[];
  sku?: string;
  inventory: number;

  // Variant fields (undefined = no variants)
  hasVariants: boolean;
  sizeValue?: string;
  sizeSystem?: SizeSystem | null; // null = needs fix
  sizeDisplay?: string;
  variantPrice?: number;
  variantInventory?: number;
  variantSku?: string;
  variantColor?: string;

  // Review state
  status: ImportRowStatus;
  statusReason?: string;

  // Source
  sourcePlatform?: string;
  sourceThumbnail?: string;
}
