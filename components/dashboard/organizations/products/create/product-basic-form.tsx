"use client";

import type { InputProps } from "@heroui/react";
import React from "react";
import { Input, Textarea, Select, SelectItem } from "@heroui/react";
import { ProductFormData } from "./product-creation";
import ProductImageUpload from "./product-image-upload";
import {
  getCategoryGroup,
  WEARABLE_CONDITIONS,
  COLLECTIBLE_CONDITIONS,
  FOOTBALL_CONDITIONS,
  COLLECTIBLE_SUBCATEGORIES,
} from "@/lib/constants/product-categories";

interface ProductBasicFormProps {
  data: Partial<ProductFormData>;
  onUpdate: (data: Partial<ProductFormData>) => void;
}

const categories = [
  { key: "JERSEYS", label: "Jerseys" },
  { key: "BOOTS", label: "Boots" },
  { key: "COLLECTIBLES", label: "Collectibles" },
  { key: "FOOTBALLS", label: "Footballs" },
  { key: "GOALKEEPER_GLOVES", label: "Goalkeeper Gloves" },
  { key: "SHIN_GUARDS", label: "Shin Guards" },
  { key: "TRAINING_EQUIPMENT", label: "Training Equipment" },
  { key: "ACCESSORIES", label: "Accessories" },
];

export default function ProductBasicForm({
  data,
  onUpdate,
}: ProductBasicFormProps) {
  const categoryGroup = getCategoryGroup(data.category || "");

  const conditions =
    categoryGroup === "COLLECTIBLE"
      ? COLLECTIBLE_CONDITIONS
      : categoryGroup === "FOOTBALL"
      ? FOOTBALL_CONDITIONS
      : WEARABLE_CONDITIONS;

  const inputProps: Pick<InputProps, "labelPlacement" | "classNames"> = {
    labelPlacement: "outside",
    classNames: {
      label:
        "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
    },
  };

  return (
    <>
      <div className="text-default-foreground text-2xl leading-8 font-medium text-left">
        Basic Information
      </div>
      <div className="text-sm text-default-500 py-1 text-left">
        Start with the essential details of your product
      </div>
      <form className="flex grid grid-cols-12 flex-col gap-4 py-8">
        <Input
          className="col-span-12"
          label="Product Name"
          placeholder="e.g., Nike Air Jordan 1 Retro High"
          value={data.name || ""}
          onValueChange={(value) => onUpdate({ name: value })}
          isRequired
          {...inputProps}
        />

        <Textarea
          className="col-span-12"
          label="Description"
          placeholder="Describe your product in detail..."
          value={data.description || ""}
          onValueChange={(value) => onUpdate({ description: value })}
          minRows={3}
          isRequired
          labelPlacement="outside"
          classNames={{
            label:
              "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
          }}
        />

        <Select
          className="col-span-12"
          label="Category"
          placeholder="Select a category"
          selectedKeys={data.category ? [data.category] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            onUpdate({ category: selected });
          }}
          isRequired
          labelPlacement="outside"
          classNames={{
            label:
              "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
          }}
        >
          {categories.map((category) => (
            <SelectItem key={category.key}>{category.label}</SelectItem>
          ))}
        </Select>

        {categoryGroup === "COLLECTIBLE" && (
          <Select
            className="col-span-12"
            label="Type"
            placeholder="Stickers or Trading Cards"
            selectedKeys={data.subcategory ? [data.subcategory] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              onUpdate({ subcategory: selected });
            }}
            isRequired
            labelPlacement="outside"
            classNames={{
              label:
                "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
            }}
          >
            {COLLECTIBLE_SUBCATEGORIES.map((s) => (
              <SelectItem key={s.key}>{s.label}</SelectItem>
            ))}
          </Select>
        )}

        <Select
          className="col-span-12"
          label="Condition"
          placeholder="Select condition"
          selectedKeys={data.condition ? [data.condition] : []}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            onUpdate({ condition: selected });
          }}
          isRequired
          labelPlacement="outside"
          classNames={{
            label:
              "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
          }}
        >
          {conditions.map((condition) => (
            <SelectItem key={condition.key}>{condition.label}</SelectItem>
          ))}
        </Select>

        <div className="col-span-12">
          <label className="text-small font-medium text-default-700 mb-2 block">
            Product Images
          </label>
          <ProductImageUpload
            images={data.images || []}
            onImagesChange={(images) => onUpdate({ images })}
          />
        </div>
      </form>
    </>
  );
}
