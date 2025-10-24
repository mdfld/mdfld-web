"use client";

import type { InputProps } from "@heroui/react";
import React from "react";
import { Input, Card, CardBody } from "@heroui/react";
import { ProductFormData } from "./product-creation";

interface ProductPricingFormProps {
  data: Partial<ProductFormData>;
  onUpdate: (data: Partial<ProductFormData>) => void;
}

export default function ProductPricingForm({
  data,
  onUpdate,
}: ProductPricingFormProps) {
  const platformFee = 0.1; // 10% platform fee
  const sellerReceives = data.price ? data.price * (1 - platformFee) : 0;

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
        Pricing & Inventory
      </div>
      <div className="text-sm text-default-500 py-1 text-left">
        Set your price and manage inventory
      </div>
      <form className="flex grid grid-cols-12 flex-col gap-4 py-8">
        <Input
          className="col-span-12"
          label="Price"
          placeholder="0.00"
          value={data.price?.toString() || ""}
          onValueChange={(value) => onUpdate({ price: parseFloat(value) || 0 })}
          type="number"
          step="0.01"
          min="0"
          isRequired
          startContent={
            <div className="pointer-events-none flex items-center">
              <span className="text-default-400 text-small">$</span>
            </div>
          }
          {...inputProps}
        />

        {data.price && data.price > 0 && (
          <Card className="col-span-12 bg-default-50 dark:bg-default-100/50">
            <CardBody className="gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-default-600">Platform Fee (10%)</span>
                <span className="text-default-600">
                  ${(data.price * platformFee).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-default-800">You'll receive</span>
                <span className="text-success">
                  ${sellerReceives.toFixed(2)}
                </span>
              </div>
            </CardBody>
          </Card>
        )}

        <Input
          className="col-span-12"
          label="Quantity"
          placeholder="0"
          value={data.quantity?.toString() || ""}
          onValueChange={(value) =>
            onUpdate({ quantity: parseInt(value) || 0 })
          }
          type="number"
          min="1"
          isRequired
          description="How many units do you have available?"
          {...inputProps}
        />

        <Input
          className="col-span-12"
          label="SKU (Stock Keeping Unit)"
          placeholder="e.g., AJ1-BLK-10"
          value={data.sku || ""}
          onValueChange={(value) => onUpdate({ sku: value })}
          description="Optional: Your internal product identifier"
          {...inputProps}
        />
      </form>
    </>
  );
}
