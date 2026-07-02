"use client";

import type { InputProps } from "@heroui/react";
import React from "react";
import { Input, Card, CardBody, RadioGroup, Radio, Select, SelectItem, Switch } from "@heroui/react";
import { ProductFormData } from "./product-creation";
import countries from "../../onboard/countries";
import { trpc } from "@/lib/trpc-client";

const CARRIERS = [
  { value: "UPS", label: "UPS" },
  { value: "USPS", label: "USPS" },
  { value: "FedEx", label: "FedEx" },
  { value: "DHL", label: "DHL" },
  { value: "Other", label: "Other" },
];

interface ProductPricingFormProps {
  data: Partial<ProductFormData>;
  onUpdate: (data: Partial<ProductFormData>) => void;
  storeShipsFromCountry?: string | null;
}

export default function ProductPricingForm({
  data,
  onUpdate,
  storeShipsFromCountry,
}: ProductPricingFormProps) {
  const { data: fees } = trpc.admin.getPublicFees.useQuery();
  const platformFee = fees?.sellerCommissionPct ?? 0;
  const sellerReceives = data.price ? data.price * (1 - platformFee) : 0;

  const shippingTerms = data.shippingTerms || "CALCULATED";
  const shipsFromCountry = data.shipsFromCountry || storeShipsFromCountry || "";

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
        Pricing & Shipping
      </div>
      <div className="text-sm text-default-500 py-1 text-left">
        Set your price, inventory, and shipping details
      </div>
      <form className="flex grid grid-cols-12 flex-col gap-4 py-8">

        {/* Price */}
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
              {platformFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-default-600">Platform Fee ({(platformFee * 100).toFixed(0)}%)</span>
                  <span className="text-default-600">
                    ${(data.price * platformFee).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span className="text-default-800">You&apos;ll receive</span>
                <span className="text-success">${sellerReceives.toFixed(2)}</span>
              </div>
            </CardBody>
          </Card>
        )}

        <Input
          className="col-span-12"
          label="Quantity"
          placeholder="0"
          value={data.quantity?.toString() || ""}
          onValueChange={(value) => onUpdate({ quantity: parseInt(value) || 0 })}
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

        {/* Shipping dimensions — required for rate calculation */}
        <div className="col-span-12 space-y-4 border-t border-zinc-700 pt-4">
          <div>
            <p className="text-sm font-medium text-default-700">Shipping Details</p>
            <p className="text-xs text-default-400 mt-0.5">Required for calculating shipping rates at checkout</p>
          </div>

          <Input
            label="Weight (kg)"
            placeholder="e.g., 0.5"
            type="number"
            min="0.01"
            step="0.01"
            isRequired
            value={data.weight ? String(data.weight) : ""}
            onValueChange={(v) => onUpdate({ weight: parseFloat(v) || 0 })}
            description="Total item weight including packaging"
            isInvalid={!data.weight || data.weight <= 0}
            errorMessage={!data.weight || data.weight <= 0 ? "Weight is required" : undefined}
            {...inputProps}
          />

          <div>
            <p className="text-sm font-medium text-default-700 mb-2">Dimensions (cm) <span className="text-danger">*</span></p>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Length"
                placeholder="e.g., 30"
                type="number"
                min="1"
                isRequired
                value={data.dimensions?.length ? String(data.dimensions.length) : ""}
                onValueChange={(v) =>
                  onUpdate({ dimensions: { ...data.dimensions, length: parseFloat(v) || 0, width: data.dimensions?.width || 0, height: data.dimensions?.height || 0 } })
                }
                isInvalid={!data.dimensions?.length || data.dimensions.length <= 0}
                {...inputProps}
              />
              <Input
                label="Width"
                placeholder="e.g., 20"
                type="number"
                min="1"
                isRequired
                value={data.dimensions?.width ? String(data.dimensions.width) : ""}
                onValueChange={(v) =>
                  onUpdate({ dimensions: { ...data.dimensions, length: data.dimensions?.length || 0, width: parseFloat(v) || 0, height: data.dimensions?.height || 0 } })
                }
                isInvalid={!data.dimensions?.width || data.dimensions.width <= 0}
                {...inputProps}
              />
              <Input
                label="Height"
                placeholder="e.g., 10"
                type="number"
                min="1"
                isRequired
                value={data.dimensions?.height ? String(data.dimensions.height) : ""}
                onValueChange={(v) =>
                  onUpdate({ dimensions: { ...data.dimensions, length: data.dimensions?.length || 0, width: data.dimensions?.width || 0, height: parseFloat(v) || 0 } })
                }
                isInvalid={!data.dimensions?.height || data.dimensions.height <= 0}
                {...inputProps}
              />
            </div>
          </div>
        </div>

        {/* Shipping divider */}
        <div className="col-span-12 border-t border-zinc-700 pt-2">
          <p className="text-sm font-medium text-default-700 mb-1">Shipping</p>
          <p className="text-xs text-default-400 mb-4">
            How will shipping costs be handled for this listing?
          </p>

          <RadioGroup
            value={shippingTerms}
            onValueChange={(val) =>
              onUpdate({ shippingTerms: val as "CALCULATED" | "INCLUDED_DDP" })
            }
            classNames={{ label: "text-small text-default-700" }}
          >
            <Radio value="CALCULATED" description="Shipping cost added at checkout based on buyer location">
              Calculated at checkout
            </Radio>
            <Radio value="INCLUDED_DDP" description="You cover shipping, duties, and taxes — no surprise fees for buyers">
              Included in price (DDP)
            </Radio>
          </RadioGroup>
        </div>

        {/* Carrier */}
        <Select
          className="col-span-12 md:col-span-6"
          label="Carrier"
          placeholder="Select carrier"
          selectedKeys={data.shippingCarrier ? [data.shippingCarrier] : []}
          onSelectionChange={(keys) =>
            onUpdate({ shippingCarrier: Array.from(keys)[0] as string })
          }
          labelPlacement="outside"
          classNames={{
            label: "text-small font-medium text-default-700 group-data-[filled=true]:text-default-700",
          }}
        >
          {CARRIERS.map((c) => (
            <SelectItem key={c.value}>{c.label}</SelectItem>
          ))}
        </Select>

        {/* Estimated delivery */}
        <Input
          className="col-span-12 md:col-span-6"
          label="Estimated Delivery (days)"
          placeholder="e.g., 10"
          type="number"
          min="1"
          value={data.estimatedDeliveryDays?.toString() || ""}
          onValueChange={(value) =>
            onUpdate({ estimatedDeliveryDays: parseInt(value) || undefined })
          }
          description="Upper estimate for delivery time"
          {...inputProps}
        />

        {/* Ships from */}
        <div className="col-span-12">
          <p className="text-small font-medium text-default-700 mb-1">
            Ships from
            {storeShipsFromCountry && !data.shipsFromCountry && (
              <span className="text-xs text-default-400 font-normal ml-2">
                (using store default: {storeShipsFromCountry})
              </span>
            )}
          </p>
          <p className="text-xs text-default-400 mb-2">
            Override your store&apos;s default ships-from country for this listing only.
          </p>
          <Select
            items={countries}
            aria-label="Ships from country"
            placeholder={storeShipsFromCountry ? `Store default (${storeShipsFromCountry})` : "Select country"}
            selectedKeys={data.shipsFromCountry ? [data.shipsFromCountry] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              onUpdate({ shipsFromCountry: val || undefined });
            }}
            labelPlacement="outside"
            classNames={{
              label: "text-small font-medium text-default-700 group-data-[filled=true]:text-default-700",
            }}
          >
            {(country) => (
              <SelectItem key={country.code}>{country.name}</SelectItem>
            )}
          </Select>
        </div>

        <div className="col-span-12 border-t border-zinc-700 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-small font-medium text-default-700">Accept trade offers</p>
              <p className="text-xs text-default-400 mt-0.5">
                Allow buyers to propose item swaps or cash offers for this listing
              </p>
            </div>
            <Switch
              isSelected={data.tradeEnabled ?? false}
              onValueChange={(val) => onUpdate({ tradeEnabled: val })}
              size="sm"
            />
          </div>
        </div>

      </form>
    </>
  );
}
