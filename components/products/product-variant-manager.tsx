"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Card,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  ProductCategory,
  SizeSystem,
  VariantType,
  SoleplateType,
  PlayerVersion,
  ProductTier,
} from "@prisma/client";
import { getAvailableSizes, getSizeDisplay } from "@/lib/size-conversions";

interface ProductVariant {
  id?: string;
  sizeValue: string;
  sizeSystem: SizeSystem;
  sizeDisplay: string;
  color?: string;
  colorHex?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  inventory: number;
  images: string[];
}

interface ProductVariantManagerProps {
  category: ProductCategory;
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  basePrice?: number;
  baseSku?: string;
}

const COMMON_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#DC2626" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Green", hex: "#16A34A" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Purple", hex: "#9333EA" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Teal", hex: "#0D9488" },
];

export default function ProductVariantManager({
  category,
  variants,
  onVariantsChange,
  basePrice = 0,
  baseSku = "",
}: ProductVariantManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null,
  );
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState(basePrice.toString());
  const [bulkInventory, setBulkInventory] = useState("0");
  const [variantType, setVariantType] = useState<VariantType>(
    VariantType.SIZE_COLOR,
  );

  const availableSizes = getAvailableSizes(category);

  const handleAddVariants = () => {
    const newVariants: ProductVariant[] = [];

    if (
      variantType === VariantType.SIZE_ONLY ||
      variantType === VariantType.SIZE_COLOR
    ) {
      selectedSizes.forEach((sizeValue) => {
        const sizeInfo = availableSizes.find((s) => s.value === sizeValue);
        if (!sizeInfo) return;

        if (variantType === VariantType.SIZE_COLOR && selectedColors.size > 0) {
          selectedColors.forEach((colorName) => {
            const color = COMMON_COLORS.find((c) => c.name === colorName);
            if (!color) return;

            newVariants.push({
              sizeValue: sizeInfo.value,
              sizeSystem: sizeInfo.system,
              sizeDisplay: sizeInfo.display,
              color: color.name,
              colorHex: color.hex,
              sku: `${baseSku}-${sizeInfo.value}-${color.name}`
                .toUpperCase()
                .replace(/\s+/g, "-"),
              price: parseFloat(bulkPrice) || basePrice,
              inventory: parseInt(bulkInventory) || 0,
              images: [],
            });
          });
        } else {
          newVariants.push({
            sizeValue: sizeInfo.value,
            sizeSystem: sizeInfo.system,
            sizeDisplay: sizeInfo.display,
            sku: `${baseSku}-${sizeInfo.value}`
              .toUpperCase()
              .replace(/\s+/g, "-"),
            price: parseFloat(bulkPrice) || basePrice,
            inventory: parseInt(bulkInventory) || 0,
            images: [],
          });
        }
      });
    } else if (variantType === VariantType.COLOR_ONLY) {
      selectedColors.forEach((colorName) => {
        const color = COMMON_COLORS.find((c) => c.name === colorName);
        if (!color) return;

        newVariants.push({
          sizeValue: "ONE_SIZE",
          sizeSystem: SizeSystem.ONE_SIZE,
          sizeDisplay: "One Size",
          color: color.name,
          colorHex: color.hex,
          sku: `${baseSku}-${color.name}`.toUpperCase().replace(/\s+/g, "-"),
          price: parseFloat(bulkPrice) || basePrice,
          inventory: parseInt(bulkInventory) || 0,
          images: [],
        });
      });
    }

    onVariantsChange([...variants, ...newVariants]);
    setIsModalOpen(false);
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
  };

  const handleUpdateVariant = (updatedVariant: ProductVariant) => {
    const index = variants.findIndex((v) =>
      v.id
        ? v.id === updatedVariant.id
        : v.sizeValue === editingVariant?.sizeValue &&
          v.color === editingVariant?.color,
    );

    if (index >= 0) {
      const newVariants = [...variants];
      newVariants[index] = updatedVariant;
      onVariantsChange(newVariants);
    }

    setEditingVariant(null);
  };

  const handleDeleteVariant = (variant: ProductVariant) => {
    onVariantsChange(
      variants.filter((v) =>
        v.id
          ? v.id !== variant.id
          : !(v.sizeValue === variant.sizeValue && v.color === variant.color),
      ),
    );
  };

  const handleBulkUpdate = (field: "price" | "inventory", value: string) => {
    const updatedVariants = variants.map((variant) => ({
      ...variant,
      [field]:
        field === "price" ? parseFloat(value) || 0 : parseInt(value) || 0,
    }));
    onVariantsChange(updatedVariants);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Product Variants</h3>
          <p className="text-sm text-default-500">
            Manage sizes, colors, and inventory for each variant
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Icon icon="solar:add-circle-linear" />}
          onPress={() => setIsModalOpen(true)}
        >
          Add Variants
        </Button>
      </div>

      {variants.length > 0 ? (
        <>
          {/* Bulk Actions */}
          <Card>
            <CardBody className="flex flex-row gap-4 items-center">
              <div className="flex-1">
                <Input
                  label="Bulk Update Price"
                  placeholder="Enter price"
                  type="number"
                  startContent="$"
                  size="sm"
                  onValueChange={(value) => handleBulkUpdate("price", value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Bulk Update Inventory"
                  placeholder="Enter quantity"
                  type="number"
                  size="sm"
                  onValueChange={(value) =>
                    handleBulkUpdate("inventory", value)
                  }
                />
              </div>
            </CardBody>
          </Card>

          {/* Variants Table */}
          <Table aria-label="Product variants">
            <TableHeader>
              <TableColumn>VARIANT</TableColumn>
              <TableColumn>SKU</TableColumn>
              <TableColumn>PRICE</TableColumn>
              <TableColumn>INVENTORY</TableColumn>
              <TableColumn>ACTIONS</TableColumn>
            </TableHeader>
            <TableBody>
              {variants.map((variant, index) => (
                <TableRow
                  key={
                    variant.id ||
                    `${variant.sizeValue}-${variant.color}-${index}`
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {variant.color && (
                        <div
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {variant.sizeDisplay}
                        </p>
                        {variant.color && (
                          <p className="text-xs text-default-400">
                            {variant.color}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-mono">{variant.sku}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">
                      ${variant.price.toFixed(2)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        variant.inventory === 0
                          ? "danger"
                          : variant.inventory < 10
                            ? "warning"
                            : "success"
                      }
                    >
                      {variant.inventory}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEditVariant(variant)}
                      >
                        <Icon icon="solar:pen-linear" className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="danger"
                        onPress={() => handleDeleteVariant(variant)}
                      >
                        <Icon
                          icon="solar:trash-bin-linear"
                          className="w-4 h-4"
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <Card>
          <CardBody className="text-center py-8">
            <Icon
              icon="solar:box-linear"
              className="w-12 h-12 mx-auto mb-2 text-default-300"
            />
            <p className="text-default-500">No variants added yet</p>
            <p className="text-sm text-default-400">
              Click "Add Variants" to get started
            </p>
          </CardBody>
        </Card>
      )}

      {/* Add Variants Modal */}
      <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add Product Variants</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Select
                    label="Variant Type"
                    selectedKeys={[variantType]}
                    onSelectionChange={(keys) =>
                      setVariantType(Array.from(keys)[0] as VariantType)
                    }
                  >
                    <SelectItem key={VariantType.SIZE_COLOR}>
                      Size & Color
                    </SelectItem>
                    <SelectItem key={VariantType.SIZE_ONLY}>
                      Size Only
                    </SelectItem>
                    <SelectItem key={VariantType.COLOR_ONLY}>
                      Color Only
                    </SelectItem>
                  </Select>

                  {(variantType === VariantType.SIZE_ONLY ||
                    variantType === VariantType.SIZE_COLOR) && (
                    <div>
                      <p className="text-sm font-medium mb-2">Select Sizes</p>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map((size) => (
                          <Chip
                            key={size.value}
                            variant={
                              selectedSizes.has(size.value)
                                ? "solid"
                                : "bordered"
                            }
                            color={
                              selectedSizes.has(size.value)
                                ? "primary"
                                : "default"
                            }
                            className="cursor-pointer"
                            onClick={() => {
                              const newSelected = new Set(selectedSizes);
                              if (newSelected.has(size.value)) {
                                newSelected.delete(size.value);
                              } else {
                                newSelected.add(size.value);
                              }
                              setSelectedSizes(newSelected);
                            }}
                          >
                            {size.value}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {(variantType === VariantType.COLOR_ONLY ||
                    variantType === VariantType.SIZE_COLOR) && (
                    <div>
                      <p className="text-sm font-medium mb-2">Select Colors</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_COLORS.map((color) => (
                          <Chip
                            key={color.name}
                            variant={
                              selectedColors.has(color.name)
                                ? "solid"
                                : "bordered"
                            }
                            startContent={
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color.hex }}
                              />
                            }
                            className="cursor-pointer"
                            onClick={() => {
                              const newSelected = new Set(selectedColors);
                              if (newSelected.has(color.name)) {
                                newSelected.delete(color.name);
                              } else {
                                newSelected.add(color.name);
                              }
                              setSelectedColors(newSelected);
                            }}
                          >
                            {color.name}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Input
                      label="Price for all variants"
                      placeholder="0.00"
                      type="number"
                      startContent="$"
                      value={bulkPrice}
                      onValueChange={setBulkPrice}
                    />
                    <Input
                      label="Initial inventory"
                      placeholder="0"
                      type="number"
                      value={bulkInventory}
                      onValueChange={setBulkInventory}
                    />
                  </div>

                  <p className="text-sm text-default-500">
                    This will create{" "}
                    {variantType === VariantType.SIZE_COLOR
                      ? selectedSizes.size * selectedColors.size
                      : variantType === VariantType.SIZE_ONLY
                        ? selectedSizes.size
                        : selectedColors.size}{" "}
                    variants
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddVariants}
                  isDisabled={
                    (variantType === VariantType.SIZE_ONLY &&
                      selectedSizes.size === 0) ||
                    (variantType === VariantType.COLOR_ONLY &&
                      selectedColors.size === 0) ||
                    (variantType === VariantType.SIZE_COLOR &&
                      (selectedSizes.size === 0 || selectedColors.size === 0))
                  }
                >
                  Add Variants
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Variant Modal */}
      <Modal
        isOpen={!!editingVariant}
        onOpenChange={() => setEditingVariant(null)}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Edit Variant</ModalHeader>
              <ModalBody>
                {editingVariant && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {editingVariant.color && (
                        <div
                          className="w-8 h-8 rounded-full border"
                          style={{ backgroundColor: editingVariant.colorHex }}
                        />
                      )}
                      <div>
                        <p className="font-medium">
                          {editingVariant.sizeDisplay}
                        </p>
                        {editingVariant.color && (
                          <p className="text-sm text-default-400">
                            {editingVariant.color}
                          </p>
                        )}
                      </div>
                    </div>
                    <Input
                      label="SKU"
                      value={editingVariant.sku || ""}
                      onValueChange={(value) =>
                        setEditingVariant({ ...editingVariant, sku: value })
                      }
                    />
                    <Input
                      label="Price"
                      type="number"
                      startContent="$"
                      value={editingVariant.price.toString()}
                      onValueChange={(value) =>
                        setEditingVariant({
                          ...editingVariant,
                          price: parseFloat(value) || 0,
                        })
                      }
                    />
                    <Input
                      label="Compare at Price"
                      type="number"
                      startContent="$"
                      value={editingVariant.compareAtPrice?.toString() || ""}
                      onValueChange={(value) =>
                        setEditingVariant({
                          ...editingVariant,
                          compareAtPrice: value ? parseFloat(value) : undefined,
                        })
                      }
                    />
                    <Input
                      label="Inventory"
                      type="number"
                      value={editingVariant.inventory.toString()}
                      onValueChange={(value) =>
                        setEditingVariant({
                          ...editingVariant,
                          inventory: parseInt(value) || 0,
                        })
                      }
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    if (editingVariant) {
                      handleUpdateVariant(editingVariant);
                    }
                  }}
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
