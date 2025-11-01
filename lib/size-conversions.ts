import { SizeSystem, ProductCategory } from "@prisma/client";

export interface SizeConversion {
  UK?: number | string;
  US?: number | string;
  EU?: number | string;
  JP?: number | string;
  CM?: number | string;
}

export interface ApparelSize {
  standard: string; // XS, S, M, L, XL, etc.
  numeric?: string; // 0-2, 4-6, etc.
  chest?: string; // 34-36, 38-40, etc.
}

// Men's footwear size conversions
export const MENS_FOOTWEAR_SIZES: SizeConversion[] = [
  { UK: 3, US: 3.5, EU: 35.5, JP: 22, CM: 22 },
  { UK: 3.5, US: 4, EU: 36, JP: 22.5, CM: 22.5 },
  { UK: 4, US: 4.5, EU: 36.5, JP: 23, CM: 23 },
  { UK: 4.5, US: 5, EU: 37.5, JP: 23.5, CM: 23.5 },
  { UK: 5, US: 5.5, EU: 38, JP: 24, CM: 24 },
  { UK: 5.5, US: 6, EU: 38.5, JP: 24.5, CM: 24.5 },
  { UK: 6, US: 6.5, EU: 39, JP: 25, CM: 25 },
  { UK: 6.5, US: 7, EU: 40, JP: 25.5, CM: 25.5 },
  { UK: 7, US: 7.5, EU: 40.5, JP: 26, CM: 26 },
  { UK: 7.5, US: 8, EU: 41, JP: 26.5, CM: 26.5 },
  { UK: 8, US: 8.5, EU: 42, JP: 27, CM: 27 },
  { UK: 8.5, US: 9, EU: 42.5, JP: 27.5, CM: 27.5 },
  { UK: 9, US: 9.5, EU: 43, JP: 28, CM: 28 },
  { UK: 9.5, US: 10, EU: 44, JP: 28.5, CM: 28.5 },
  { UK: 10, US: 10.5, EU: 44.5, JP: 29, CM: 29 },
  { UK: 10.5, US: 11, EU: 45, JP: 29.5, CM: 29.5 },
  { UK: 11, US: 11.5, EU: 45.5, JP: 30, CM: 30 },
  { UK: 11.5, US: 12, EU: 46, JP: 30.5, CM: 30.5 },
  { UK: 12, US: 12.5, EU: 47, JP: 31, CM: 31 },
  { UK: 12.5, US: 13, EU: 47.5, JP: 31.5, CM: 31.5 },
  { UK: 13, US: 13.5, EU: 48, JP: 32, CM: 32 },
  { UK: 13.5, US: 14, EU: 48.5, JP: 32.5, CM: 32.5 },
  { UK: 14, US: 14.5, EU: 49, JP: 33, CM: 33 },
];

// Women's footwear size conversions (different from men's)
export const WOMENS_FOOTWEAR_SIZES: SizeConversion[] = [
  { UK: 2, US: 4, EU: 35, JP: 21, CM: 21 },
  { UK: 2.5, US: 4.5, EU: 35.5, JP: 21.5, CM: 21.5 },
  { UK: 3, US: 5, EU: 36, JP: 22, CM: 22 },
  { UK: 3.5, US: 5.5, EU: 36.5, JP: 22.5, CM: 22.5 },
  { UK: 4, US: 6, EU: 37, JP: 23, CM: 23 },
  { UK: 4.5, US: 6.5, EU: 37.5, JP: 23.5, CM: 23.5 },
  { UK: 5, US: 7, EU: 38, JP: 24, CM: 24 },
  { UK: 5.5, US: 7.5, EU: 38.5, JP: 24.5, CM: 24.5 },
  { UK: 6, US: 8, EU: 39, JP: 25, CM: 25 },
  { UK: 6.5, US: 8.5, EU: 40, JP: 25.5, CM: 25.5 },
  { UK: 7, US: 9, EU: 40.5, JP: 26, CM: 26 },
  { UK: 7.5, US: 9.5, EU: 41, JP: 26.5, CM: 26.5 },
  { UK: 8, US: 10, EU: 42, JP: 27, CM: 27 },
  { UK: 8.5, US: 10.5, EU: 42.5, JP: 27.5, CM: 27.5 },
  { UK: 9, US: 11, EU: 43, JP: 28, CM: 28 },
];

// Standard apparel sizes
export const APPAREL_SIZES: ApparelSize[] = [
  { standard: "XS", numeric: "0-2", chest: "32-34" },
  { standard: "S", numeric: "4-6", chest: "35-37" },
  { standard: "M", numeric: "8-10", chest: "38-40" },
  { standard: "L", numeric: "12-14", chest: "41-43" },
  { standard: "XL", numeric: "16-18", chest: "44-46" },
  { standard: "XXL", numeric: "20-22", chest: "47-49" },
  { standard: "XXXL", numeric: "24-26", chest: "50-52" },
];

// Youth/Kids sizes
export const YOUTH_SIZES = {
  footwear: [
    { UK: 10, US: 10.5, EU: 28, label: "10C" },
    { UK: 10.5, US: 11, EU: 28.5, label: "11C" },
    { UK: 11, US: 11.5, EU: 29, label: "11.5C" },
    { UK: 11.5, US: 12, EU: 30, label: "12C" },
    { UK: 12, US: 12.5, EU: 30.5, label: "12.5C" },
    { UK: 12.5, US: 13, EU: 31, label: "13C" },
    { UK: 13, US: 13.5, EU: 31.5, label: "13.5C" },
    { UK: 13.5, US: 1, EU: 32, label: "1Y" },
    { UK: 1, US: 1.5, EU: 33, label: "1.5Y" },
    { UK: 1.5, US: 2, EU: 33.5, label: "2Y" },
    { UK: 2, US: 2.5, EU: 34, label: "2.5Y" },
    { UK: 2.5, US: 3, EU: 35, label: "3Y" },
    { UK: 3, US: 3.5, EU: 35.5, label: "3.5Y" },
  ],
  apparel: ["YXS", "YS", "YM", "YL", "YXL"],
};

export function convertSize(
  value: string | number,
  fromSystem: SizeSystem,
  toSystem: SizeSystem,
  category: ProductCategory,
  gender: "mens" | "womens" | "unisex" = "mens",
): string | null {
  // Handle same system conversion
  if (fromSystem === toSystem) {
    return value.toString();
  }

  // Handle one-size items
  if (fromSystem === SizeSystem.ONE_SIZE || toSystem === SizeSystem.ONE_SIZE) {
    return "ONE SIZE";
  }

  // Get appropriate size chart
  let sizeChart: SizeConversion[] = [];

  if (category === ProductCategory.BOOTS) {
    sizeChart =
      gender === "womens" ? WOMENS_FOOTWEAR_SIZES : MENS_FOOTWEAR_SIZES;
  } else {
    // For apparel, return the standard size
    if (
      fromSystem === SizeSystem.STANDARD ||
      toSystem === SizeSystem.STANDARD
    ) {
      return value.toString();
    }
  }

  // Find the size in the chart
  const sizeEntry = sizeChart.find((entry) => {
    const fromValue = (entry as any)[fromSystem];
    return fromValue?.toString() === value.toString();
  });

  if (!sizeEntry) {
    return null;
  }

  const toValue = (sizeEntry as any)[toSystem];
  return toValue?.toString() || null;
}

export function getSizeDisplay(
  value: string,
  system: SizeSystem,
  category: ProductCategory,
  showConversions: boolean = true,
  gender: "mens" | "womens" | "unisex" = "mens",
): string {
  if (!showConversions) {
    return `${system} ${value}`;
  }

  // For footwear, show multiple conversions
  if (category === ProductCategory.BOOTS) {
    const conversions: string[] = [`${system} ${value}`];

    // Add other size systems
    const systemsToShow = [SizeSystem.UK, SizeSystem.US, SizeSystem.EU];
    systemsToShow.forEach((targetSystem) => {
      if (targetSystem !== system) {
        const converted = convertSize(
          value,
          system,
          targetSystem,
          category,
          gender,
        );
        if (converted) {
          conversions.push(`${targetSystem} ${converted}`);
        }
      }
    });

    return conversions.join(" / ");
  }

  // For apparel, just show the size
  return value;
}

export function getAvailableSizes(
  category: ProductCategory,
): { value: string; system: SizeSystem; display: string }[] {
  const sizes: { value: string; system: SizeSystem; display: string }[] = [];

  if (category === ProductCategory.BOOTS) {
    // Add UK sizes (most common for football boots)
    MENS_FOOTWEAR_SIZES.forEach((size) => {
      if (size.UK) {
        sizes.push({
          value: size.UK.toString(),
          system: SizeSystem.UK,
          display: getSizeDisplay(size.UK.toString(), SizeSystem.UK, category),
        });
      }
    });
  } else if (
    category === ProductCategory.JERSEYS ||
    category === ProductCategory.TRAINING_EQUIPMENT
  ) {
    // Add standard apparel sizes
    APPAREL_SIZES.forEach((size) => {
      sizes.push({
        value: size.standard,
        system: SizeSystem.STANDARD,
        display: size.standard,
      });
    });
  } else if (category === ProductCategory.ACCESSORIES) {
    // One size or adjustable
    sizes.push({
      value: "ONE SIZE",
      system: SizeSystem.ONE_SIZE,
      display: "One Size Fits All",
    });
  }

  return sizes;
}

export function shouldShowSizeChart(category: ProductCategory): boolean {
  return [
    ProductCategory.BOOTS,
    ProductCategory.JERSEYS,
    ProductCategory.TRAINING_EQUIPMENT,
  ].includes(category as any);
}

export function getConditionalFields(category: ProductCategory): string[] {
  const fields: string[] = [];

  switch (category) {
    case ProductCategory.BOOTS:
      fields.push("soleplateType", "tier", "year");
      break;
    case ProductCategory.JERSEYS:
      fields.push("playerVersion", "season", "year");
      break;
    case ProductCategory.TRAINING_EQUIPMENT:
      fields.push("material", "season");
      break;
    case ProductCategory.TRADING_CARDS:
      fields.push("year", "tier");
      break;
    default:
      break;
  }

  return fields;
}

export function getSizeConversions(
  category: string,
  size: string,
  fromSystem: string = "US",
): Record<string, string> {
  if (category === "BOOTS") {
    const sizeEntry = MENS_FOOTWEAR_SIZES.find((entry) => {
      const value = entry[fromSystem as keyof SizeConversion];
      return value?.toString() === size;
    });

    if (sizeEntry) {
      return {
        UK: sizeEntry.UK?.toString() || size,
        US: sizeEntry.US?.toString() || size,
        EU: sizeEntry.EU?.toString() || size,
        JP: sizeEntry.JP?.toString() || size,
        CM: sizeEntry.CM?.toString() || size,
      };
    }
  }

  // Default return if no conversion found
  return {
    UK: size,
    US: size,
    EU: size,
  };
}
