"use client";

import type { InputProps } from "@heroui/react";
import React from "react";
import { Input, Chip } from "@heroui/react";
import { ProductFormData } from "./product-creation";

interface ProductDetailsFormProps {
  data: Partial<ProductFormData>;
  onUpdate: (data: Partial<ProductFormData>) => void;
}

export default function ProductDetailsForm({
  data,
  onUpdate,
}: ProductDetailsFormProps) {
  const [tagInput, setTagInput] = React.useState("");

  const inputProps: Pick<InputProps, "labelPlacement" | "classNames"> = {
    labelPlacement: "outside",
    classNames: {
      label:
        "text-small font-medium text-default-700 group-data-[filled-within=true]:text-default-700",
    },
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTags = [...(data.tags || []), tagInput.trim()];
      onUpdate({ tags: newTags });
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = (data.tags || []).filter((_, i) => i !== index);
    onUpdate({ tags: newTags });
  };

  return (
    <>
      <div className="text-default-foreground text-2xl leading-8 font-medium text-left">
        Product Details
      </div>
      <div className="text-sm text-default-500 py-1 text-left">
        Add specifications and features of your product
      </div>
      <form className="flex grid grid-cols-12 flex-col gap-4 py-8">
        <Input
          className="col-span-6"
          label="Brand"
          placeholder="e.g., Nike"
          value={data.brand || ""}
          onValueChange={(value) => onUpdate({ brand: value })}
          {...inputProps}
        />

        <Input
          className="col-span-6"
          label="Model"
          placeholder="e.g., Air Jordan 1"
          value={data.model || ""}
          onValueChange={(value) => onUpdate({ model: value })}
          {...inputProps}
        />

        <Input
          className="col-span-6"
          label="Size"
          placeholder="e.g., US 10, Large"
          value={data.size || ""}
          onValueChange={(value) => onUpdate({ size: value })}
          {...inputProps}
        />

        <Input
          className="col-span-6"
          label="Color"
          placeholder="e.g., Black/Red"
          value={data.color || ""}
          onValueChange={(value) => onUpdate({ color: value })}
          {...inputProps}
        />

        <Input
          className="col-span-12"
          label="Material"
          placeholder="e.g., Leather, Cotton"
          value={data.material || ""}
          onValueChange={(value) => onUpdate({ material: value })}
          {...inputProps}
        />

        <Input
          className="col-span-12"
          label="Tags"
          placeholder="Add tags and press Enter"
          value={tagInput}
          onValueChange={setTagInput}
          onKeyDown={handleAddTag}
          description="Press Enter to add tags"
          {...inputProps}
        />
        {data.tags && data.tags.length > 0 && (
          <div className="col-span-12 flex flex-wrap gap-2">
            {data.tags.map((tag, index) => (
              <Chip
                key={index}
                onClose={() => handleRemoveTag(index)}
                variant="flat"
                size="sm"
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </form>
    </>
  );
}
