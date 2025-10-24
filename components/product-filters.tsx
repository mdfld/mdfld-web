"use client";

import React from "react";
import {
  Accordion,
  AccordionItem,
  Button,
  Checkbox,
  CheckboxGroup,
  Slider,
} from "@heroui/react";
import {
  FOOTBALL_BRANDS,
  FOOTBALL_TEAMS,
} from "@/lib/constants/football-attributes";

export type ProductFiltersProps = {
  onFiltersChange?: (filters: any) => void;
  onReset?: () => void;
};

const CONDITIONS = [
  { value: "BRAND_NEW", label: "Brand New" },
  { value: "NEW_WITH_TAGS", label: "New with Tags" },
  { value: "USED_LIKE_NEW", label: "Used - Like New" },
  { value: "USED_GOOD", label: "Used - Good" },
];

// Using exact categories from database enum
const FOOTBALL_CATEGORIES = [
  { value: "JERSEYS", label: "Jerseys" },
  { value: "BOOTS", label: "Boots" },
  { value: "FOOTBALLS", label: "Footballs" },
  { value: "TRADING_CARDS", label: "Trading Cards" },
  { value: "GOALKEEPER_GLOVES", label: "Goalkeeper Gloves" },
  { value: "SHIN_GUARDS", label: "Shin Guards" },
  { value: "TRAINING_EQUIPMENT", label: "Training Equipment" },
  { value: "ACCESSORIES", label: "Accessories" },
];

// Boot-specific filters
const BOOT_TYPES = ["FG", "SG", "AG", "TF", "IC"];
const BOOT_SIZES_UK = [
  "UK 3",
  "UK 3.5",
  "UK 4",
  "UK 4.5",
  "UK 5",
  "UK 5.5",
  "UK 6",
  "UK 6.5",
  "UK 7",
  "UK 7.5",
  "UK 8",
  "UK 8.5",
  "UK 9",
  "UK 9.5",
  "UK 10",
  "UK 10.5",
  "UK 11",
  "UK 11.5",
  "UK 12",
  "UK 13",
];
const BOOT_SIZES_US = [
  "US 4",
  "US 4.5",
  "US 5",
  "US 5.5",
  "US 6",
  "US 6.5",
  "US 7",
  "US 7.5",
  "US 8",
  "US 8.5",
  "US 9",
  "US 9.5",
  "US 10",
  "US 10.5",
  "US 11",
  "US 11.5",
  "US 12",
  "US 12.5",
  "US 13",
  "US 14",
];

// Jersey-specific filters
const JERSEY_TYPES = ["Home", "Away", "Third", "Training", "Vintage"];
const JERSEY_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const SEASONS = ["2024/25", "2023/24", "2022/23", "2021/22", "Retro"];

// Card-specific filters
const CARD_TYPES = [
  "Base",
  "Rare",
  "Ultra Rare",
  "Limited Edition",
  "Autographed",
];
const CARD_YEARS = ["2024", "2023", "2022", "2021", "2020"];

export default function ProductFilters({
  onFiltersChange,
  onReset,
}: ProductFiltersProps) {
  const [filters, setFilters] = React.useState({
    categories: [] as string[],
    priceRange: [0, 5000] as number[],
    conditions: [] as string[],
    brands: [] as string[],
    teams: [] as string[],
    bootTypes: [] as string[],
    bootSizes: [] as string[],
    jerseyTypes: [] as string[],
    jerseySizes: [] as string[],
    seasons: [] as string[],
    cardTypes: [] as string[],
    cardYears: [] as string[],
  });

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      categories: [],
      priceRange: [0, 5000],
      conditions: [],
      brands: [],
      teams: [],
      bootTypes: [],
      bootSizes: [],
      jerseyTypes: [],
      jerseySizes: [],
      seasons: [],
      cardTypes: [],
      cardYears: [],
    };
    setFilters(resetFilters);
    onReset?.();
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "priceRange" && Array.isArray(value)) {
      return (value[0] as number) > 0 || (value[1] as number) < 5000;
    }
    return Array.isArray(value) && value.length > 0;
  });

  // Conditionally show filters based on selected categories
  const showJerseyFilters = filters.categories.includes("JERSEYS");
  const showBootFilters = filters.categories.includes("BOOTS");
  const showCardFilters = filters.categories.includes("TRADING_CARDS");

  // Build accordion items array to avoid conditional rendering issues
  const accordionItems = [];

  // Always include category filter
  accordionItems.push(
    <AccordionItem
      key="category"
      aria-label="Category"
      title="Category"
      classNames={{
        title: "text-sm font-normal",
        content: "pt-0 pb-4",
      }}
    >
      <CheckboxGroup
        value={filters.categories}
        onValueChange={(value) => updateFilter("categories", value)}
        classNames={{ wrapper: "gap-1" }}
      >
        {FOOTBALL_CATEGORIES.map((category) => (
          <Checkbox
            key={category.value}
            value={category.value}
            size="sm"
            classNames={{ label: "text-sm text-default-600" }}
          >
            {category.label}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </AccordionItem>,
  );

  // Always include price filter
  accordionItems.push(
    <AccordionItem
      key="price"
      aria-label="Price"
      title="Price Range"
      classNames={{
        title: "text-sm font-normal",
        content: "pt-0 pb-4",
      }}
    >
      <div className="px-3">
        <Slider
          label=" "
          step={50}
          minValue={0}
          maxValue={5000}
          value={filters.priceRange}
          onChange={(value) => updateFilter("priceRange", value)}
          formatOptions={{ style: "currency", currency: "USD" }}
          classNames={{
            base: "max-w-full",
            label: "text-xs",
            value: "text-xs",
          }}
          size="sm"
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-default-500">
            ${filters.priceRange[0]}
          </span>
          <span className="text-xs text-default-500">
            ${filters.priceRange[1]}
          </span>
        </div>
      </div>
    </AccordionItem>,
  );

  // Always include condition filter
  accordionItems.push(
    <AccordionItem
      key="condition"
      aria-label="Condition"
      title="Condition"
      classNames={{
        title: "text-sm font-normal",
        content: "pt-0 pb-4",
      }}
    >
      <CheckboxGroup
        value={filters.conditions}
        onValueChange={(value) => updateFilter("conditions", value)}
        classNames={{ wrapper: "gap-1" }}
      >
        {CONDITIONS.map((condition) => (
          <Checkbox
            key={condition.value}
            value={condition.value}
            size="sm"
            classNames={{ label: "text-sm text-default-600" }}
          >
            {condition.label}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </AccordionItem>,
  );

  // Always include brand filter
  accordionItems.push(
    <AccordionItem
      key="brand"
      aria-label="Brand"
      title="Brand"
      classNames={{
        title: "text-sm font-normal",
        content: "pt-0 pb-4",
      }}
    >
      <CheckboxGroup
        value={filters.brands}
        onValueChange={(value) => updateFilter("brands", value)}
        classNames={{ wrapper: "gap-1" }}
      >
        {FOOTBALL_BRANDS.slice(0, 8).map((brand) => (
          <Checkbox
            key={brand}
            value={brand}
            size="sm"
            classNames={{ label: "text-sm text-default-600" }}
          >
            {brand}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </AccordionItem>,
  );

  // Always include team filter
  accordionItems.push(
    <AccordionItem
      key="team"
      aria-label="Team"
      title="Team"
      classNames={{
        title: "text-sm font-normal",
        content: "pt-0 pb-4",
      }}
    >
      <CheckboxGroup
        value={filters.teams}
        onValueChange={(value) => updateFilter("teams", value)}
        classNames={{ wrapper: "gap-1" }}
      >
        {FOOTBALL_TEAMS.slice(0, 10).map((team) => (
          <Checkbox
            key={team}
            value={team}
            size="sm"
            classNames={{ label: "text-sm text-default-600" }}
          >
            {team}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </AccordionItem>,
  );

  // Conditionally add jersey filters
  if (showJerseyFilters) {
    accordionItems.push(
      <AccordionItem
        key="jerseyType"
        aria-label="Jersey Type"
        title="Jersey Type"
        classNames={{
          title: "text-sm font-normal",
          content: "pt-0 pb-4",
        }}
      >
        <CheckboxGroup
          value={filters.jerseyTypes}
          onValueChange={(value) => updateFilter("jerseyTypes", value)}
          classNames={{ wrapper: "gap-1" }}
        >
          {JERSEY_TYPES.map((type) => (
            <Checkbox
              key={type}
              value={type}
              size="sm"
              classNames={{ label: "text-sm text-default-600" }}
            >
              {type}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </AccordionItem>,
    );

    accordionItems.push(
      <AccordionItem
        key="season"
        aria-label="Season"
        title="Season"
        classNames={{
          title: "text-sm font-normal",
          content: "pt-0 pb-4",
        }}
      >
        <CheckboxGroup
          value={filters.seasons}
          onValueChange={(value) => updateFilter("seasons", value)}
          classNames={{ wrapper: "gap-1" }}
        >
          {SEASONS.map((season) => (
            <Checkbox
              key={season}
              value={season}
              size="sm"
              classNames={{ label: "text-sm text-default-600" }}
            >
              {season}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </AccordionItem>,
    );
  }

  // Conditionally add boot filters
  if (showBootFilters) {
    accordionItems.push(
      <AccordionItem
        key="bootType"
        aria-label="Boot Type"
        title="Soleplate Type"
        classNames={{
          title: "text-sm font-normal",
          content: "pt-0 pb-4",
        }}
      >
        <CheckboxGroup
          value={filters.bootTypes}
          onValueChange={(value) => updateFilter("bootTypes", value)}
          classNames={{ wrapper: "gap-1" }}
        >
          {BOOT_TYPES.map((type) => (
            <Checkbox
              key={type}
              value={type}
              size="sm"
              classNames={{ label: "text-sm text-default-600" }}
            >
              {type}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </AccordionItem>,
    );

    accordionItems.push(
      <AccordionItem
        key="bootSize"
        aria-label="Boot Size"
        title="Size (UK)"
        classNames={{
          title: "text-sm font-normal",
          content: "pt-0 pb-4",
        }}
      >
        <CheckboxGroup
          value={filters.bootSizes}
          onValueChange={(value) => updateFilter("bootSizes", value)}
          classNames={{ wrapper: "gap-1" }}
        >
          {BOOT_SIZES_UK.map((size: string) => (
            <Checkbox
              key={size}
              value={size}
              size="sm"
              classNames={{ label: "text-sm text-default-600" }}
            >
              {size}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </AccordionItem>,
    );
  }

  // Conditionally add card filters
  if (showCardFilters) {
    accordionItems.push(
      <AccordionItem
        key="cardType"
        aria-label="Card Type"
        title="Card Type"
        classNames={{
          title: "text-sm font-normal",
          content: "pt-0 pb-4",
        }}
      >
        <CheckboxGroup
          value={filters.cardTypes}
          onValueChange={(value) => updateFilter("cardTypes", value)}
          classNames={{ wrapper: "gap-1" }}
        >
          {CARD_TYPES.map((type) => (
            <Checkbox
              key={type}
              value={type}
              size="sm"
              classNames={{ label: "text-sm text-default-600" }}
            >
              {type}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </AccordionItem>,
    );

    accordionItems.push(
      <AccordionItem
        key="cardYear"
        aria-label="Card Year"
        title="Year"
        classNames={{
          title: "text-sm font-normal",
          content: "pt-0 pb-4",
        }}
      >
        <CheckboxGroup
          value={filters.cardYears}
          onValueChange={(value) => updateFilter("cardYears", value)}
          classNames={{ wrapper: "gap-1" }}
        >
          {CARD_YEARS.map((year) => (
            <Checkbox
              key={year}
              value={year}
              size="sm"
              classNames={{ label: "text-sm text-default-600" }}
            >
              {year}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </AccordionItem>,
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filters</h3>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="light"
            onPress={handleReset}
            className="h-7 px-2 text-xs"
          >
            Clear all
          </Button>
        )}
      </div>

      <Accordion
        selectionMode="multiple"
        defaultExpandedKeys={["category"]}
        className="-mx-1"
      >
        {accordionItems}
      </Accordion>
    </div>
  );
}
