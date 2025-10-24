"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, Package, TrendingUp, AlertCircle } from "lucide-react";
import {
  Input,
  Button,
  Card,
  CardBody,
  Chip,
  Checkbox,
  Tooltip,
} from "@heroui/react";
import { cn } from "@/lib/utils";
import { getSizeConversions } from "@/lib/size-conversions";

interface Size {
  id: string;
  label: string;
  value: string;
  conversions?: Record<string, string>;
}

interface VariantData {
  sizeId: string;
  stock: number;
  priceAdjustment: number;
  enabled: boolean;
}

interface ProductVariantManagerNextUIProps {
  basePrice: number;
  category: string;
  onChange?: (variants: VariantData[]) => void;
}

const SIZE_GROUPS = {
  CLEATS: [
    { start: 6, end: 13, increment: 0.5, prefix: "US " },
    { start: 5.5, end: 12.5, increment: 0.5, prefix: "UK " },
    { start: 38.5, end: 48, increment: 0.5, prefix: "EU " },
  ],
  JERSEYS: [{ sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] }],
  TRAINING_WEAR: [{ sizes: ["XS", "S", "M", "L", "XL", "XXL"] }],
  TRAINING_GEAR: [{ sizes: ["XS", "S", "M", "L", "XL", "XXL"] }],
  ACCESSORIES: [{ sizes: ["ONE SIZE", "S/M", "L/XL"] }],
};

export function ProductVariantManagerNextUI({
  basePrice,
  category,
  onChange,
}: ProductVariantManagerNextUIProps) {
  const [variants, setVariants] = useState<Map<string, VariantData>>(new Map());
  const [bulkStock, setBulkStock] = useState("");
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());

  // Generate sizes based on category
  const generateSizes = (): Size[] => {
    const sizeGroup = SIZE_GROUPS[category as keyof typeof SIZE_GROUPS];
    if (!sizeGroup) return [];

    const sizes: Size[] = [];

    if (category === "CLEATS") {
      // Generate shoe sizes with conversions
      const usGroup = sizeGroup[0] as {
        start: number;
        end: number;
        increment: number;
        prefix: string;
      };
      for (
        let size = usGroup.start;
        size <= usGroup.end;
        size += usGroup.increment
      ) {
        const conversions = getSizeConversions("CLEATS", size.toString(), "US");
        sizes.push({
          id: `US_${size}`,
          label: `US ${size}`,
          value: size.toString(),
          conversions,
        });
      }
    } else {
      // Generate clothing sizes
      const group = sizeGroup[0] as { sizes: string[] };
      group.sizes.forEach((size) => {
        sizes.push({
          id: size,
          label: size,
          value: size,
        });
      });
    }

    return sizes;
  };

  const sizes = generateSizes();

  // Initialize variants when category changes
  useEffect(() => {
    const newVariants = new Map<string, VariantData>();
    sizes.forEach((size) => {
      newVariants.set(size.id, {
        sizeId: size.id,
        stock: 0,
        priceAdjustment: 0,
        enabled: false,
      });
    });
    setVariants(newVariants);
  }, [category]);

  // Notify parent of changes
  useEffect(() => {
    const enabledVariants = Array.from(variants.values()).filter(
      (v) => v.enabled,
    );
    onChange?.(enabledVariants);
  }, [variants, onChange]);

  const toggleSize = (sizeId: string) => {
    setVariants((prev) => {
      const newMap = new Map(prev);
      const variant = newMap.get(sizeId)!;
      newMap.set(sizeId, { ...variant, enabled: !variant.enabled });
      return newMap;
    });

    setSelectedSizes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sizeId)) {
        newSet.delete(sizeId);
      } else {
        newSet.add(sizeId);
      }
      return newSet;
    });
  };

  const updateVariant = (
    sizeId: string,
    field: keyof VariantData,
    value: any,
  ) => {
    setVariants((prev) => {
      const newMap = new Map(prev);
      const variant = newMap.get(sizeId)!;
      newMap.set(sizeId, { ...variant, [field]: value });
      return newMap;
    });
  };

  const applyBulkChanges = () => {
    setVariants((prev) => {
      const newMap = new Map(prev);
      selectedSizes.forEach((sizeId) => {
        const variant = newMap.get(sizeId)!;
        const updates: Partial<VariantData> = {};

        if (bulkStock) updates.stock = parseInt(bulkStock);
        if (bulkPriceAdjustment)
          updates.priceAdjustment = parseFloat(bulkPriceAdjustment);

        newMap.set(sizeId, { ...variant, ...updates });
      });
      return newMap;
    });

    setBulkStock("");
    setBulkPriceAdjustment("");
  };

  const enabledCount = Array.from(variants.values()).filter(
    (v) => v.enabled,
  ).length;
  const totalStock = Array.from(variants.values())
    .filter((v) => v.enabled)
    .reduce((sum, v) => sum + v.stock, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-default-500">
                  Active Sizes
                </p>
                <p className="text-2xl font-bold">{enabledCount}</p>
              </div>
              <Package className="h-8 w-8 text-default-400" />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-default-500">
                  Total Stock
                </p>
                <p className="text-2xl font-bold">{totalStock}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-default-400" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedSizes.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/50 bg-primary/5">
              <CardBody>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">
                    {selectedSizes.size} sizes selected
                  </p>
                </div>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    placeholder="Set stock"
                    value={bulkStock}
                    onChange={(e) => setBulkStock(e.target.value)}
                    size="sm"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price adjustment"
                    value={bulkPriceAdjustment}
                    onChange={(e) => setBulkPriceAdjustment(e.target.value)}
                    size="sm"
                  />
                  <Button
                    onPress={applyBulkChanges}
                    size="sm"
                    color="primary"
                    variant="flat"
                  >
                    Apply
                  </Button>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Grid */}
      <div className="space-y-4">
        <p className="font-medium">Select Sizes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sizes.map((size) => {
            const variant = variants.get(size.id);
            const isEnabled = variant?.enabled || false;
            const isSelected = selectedSizes.has(size.id);

            return (
              <motion.div
                key={size.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  isPressable
                  className={cn(
                    "relative",
                    isEnabled && "border-primary bg-primary/5",
                    isSelected && "ring-2 ring-primary ring-offset-2",
                  )}
                  onPress={() => toggleSize(size.id)}
                >
                  <CardBody className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{size.label}</span>
                        {isEnabled && (
                          <Chip size="sm" color="primary" variant="flat">
                            Active
                          </Chip>
                        )}
                      </div>

                      {size.conversions && category === "CLEATS" && (
                        <div className="text-xs text-default-500 space-y-0.5">
                          <div>UK {size.conversions.UK}</div>
                          <div>EU {size.conversions.EU}</div>
                        </div>
                      )}

                      {isEnabled && (
                        <div className="text-xs space-y-1 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-default-500">Stock:</span>
                            <span className="font-medium">
                              {variant?.stock || 0}
                            </span>
                          </div>
                          {variant && variant.priceAdjustment !== 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-default-500">Price:</span>
                              <span className="font-medium">
                                {variant.priceAdjustment > 0 ? "+" : ""}$
                                {variant.priceAdjustment}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selection checkbox */}
                    <div
                      className="absolute top-1 right-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSizes((prev) => {
                          const newSet = new Set(prev);
                          if (newSet.has(size.id)) {
                            newSet.delete(size.id);
                          } else {
                            newSet.add(size.id);
                          }
                          return newSet;
                        });
                      }}
                    >
                      <Checkbox isSelected={isSelected} size="sm" />
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Detailed Variant Editor */}
      <AnimatePresence>
        {enabledCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <p className="font-medium">Variant Details</p>
            <div className="space-y-2">
              {Array.from(variants.entries())
                .filter(([_, v]) => v.enabled)
                .map(([sizeId, variant]) => {
                  const size = sizes.find((s) => s.id === sizeId)!;
                  const finalPrice = basePrice + variant.priceAdjustment;

                  return (
                    <Card key={sizeId}>
                      <CardBody className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="font-medium">{size.label}</div>
                            {size.conversions && (
                              <div className="text-xs text-default-500">
                                UK {size.conversions.UK} • EU{" "}
                                {size.conversions.EU}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                ${finalPrice.toFixed(2)}
                              </div>
                              {variant.priceAdjustment !== 0 && (
                                <div className="text-xs text-default-500">
                                  {variant.priceAdjustment > 0 ? "+" : ""}$
                                  {variant.priceAdjustment}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={variant.stock.toString()}
                                onChange={(e) =>
                                  updateVariant(
                                    sizeId,
                                    "stock",
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="w-20"
                                size="sm"
                                placeholder="Stock"
                                onClick={(e) => e.stopPropagation()}
                              />

                              <Tooltip content="Remove this size">
                                <Button
                                  size="sm"
                                  variant="light"
                                  isIconOnly
                                  onPress={() => toggleSize(sizeId)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
