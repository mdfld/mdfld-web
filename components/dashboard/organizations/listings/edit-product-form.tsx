"use client";

import React, { useState } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Button,
  Spinner,
  Image,
  Card,
} from "@heroui/react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import { Icon } from "@iconify/react";
import { useUploadThing } from "@/lib/uploadclient";

interface EditProductFormProps {
  product: any;
  onComplete: () => void;
  onClose: () => void;
}

const categories = [
  { value: "APPAREL", label: "Apparel" },
  { value: "FOOTWEAR", label: "Footwear" },
  { value: "ACCESSORIES", label: "Accessories" },
  { value: "BAGS", label: "Bags" },
  { value: "JEWELRY", label: "Jewelry" },
  { value: "OTHER", label: "Other" },
];

const conditions = [
  { value: "BRAND_NEW", label: "Brand New" },
  { value: "NEW_WITH_TAGS", label: "New with Tags" },
  { value: "NEW_WITHOUT_TAGS", label: "New without Tags" },
  { value: "USED_LIKE_NEW", label: "Used - Like New" },
  { value: "USED_GOOD", label: "Used - Good" },
  { value: "USED_FAIR", label: "Used - Fair" },
];

export default function EditProductForm({
  product,
  onComplete,
  onClose,
}: EditProductFormProps) {
  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description,
    price: product.price.toString(),
    inventory: product.inventory.toString(),
    category: product.category,
    condition: product.condition,
    sku: product.sku || "",
    brand: product.brand || "",
    isActive: product.isActive,
  });
  const [images, setImages] = useState<string[]>(product.images || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const updateProduct = trpc.product.update.useMutation();
  const { startUpload } = useUploadThing("productImageUploader");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const totalImages = images.length + newFiles.length;

    if (totalImages > 10) {
      toast.error(
        `Maximum 10 images allowed. You can add ${10 - images.length} more.`,
      );
      return;
    }

    setIsUploading(true);
    try {
      const response = await startUpload(newFiles);
      if (response) {
        const newImageUrls = response.map((file: any) => file.url);
        setImages([...images, ...newImageUrls]);
        toast.success("Images uploaded successfully!");
      }
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.inventory) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (images.length === 0) {
      toast.error("Please add at least one product image");
      return;
    }

    setIsLoading(true);
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          inventory: parseInt(formData.inventory, 10),
          category: formData.category as any,
          condition: formData.condition as any,
          sku: formData.sku || undefined,
          brand: formData.brand || undefined,
          isActive: formData.isActive,
          images: images,
        },
      });

      toast.success("Product updated successfully!");
      onComplete();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Image Upload Section */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Product Images</label>
        <div className="grid grid-cols-5 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <Image
                src={image}
                alt={`Product ${index + 1}`}
                className="w-full h-24 object-cover"
              />
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onPress={() => removeImage(index)}
              >
                <Icon icon="heroicons:x-mark-20-solid" />
              </Button>
            </Card>
          ))}
          {images.length < 10 && (
            <label className="border-2 border-dashed border-default-300 rounded-lg h-24 flex items-center justify-center cursor-pointer hover:border-default-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {isUploading ? (
                <Spinner size="sm" />
              ) : (
                <div className="text-center">
                  <Icon
                    icon="heroicons:plus-20-solid"
                    className="w-6 h-6 mx-auto text-default-400"
                  />
                  <p className="text-xs text-default-400 mt-1">Add Image</p>
                </div>
              )}
            </label>
          )}
        </div>
        <p className="text-xs text-default-400">{images.length}/10 images</p>
      </div>

      <Input
        label="Product Name"
        placeholder="Enter product name"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        isRequired
      />

      <Textarea
        label="Description"
        placeholder="Enter product description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        minRows={3}
      />

      <div className="flex gap-4">
        <Input
          type="number"
          step="0.01"
          label="Price"
          placeholder="0.00"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          startContent="$"
          isRequired
        />

        <Input
          type="number"
          label="Inventory"
          placeholder="0"
          value={formData.inventory}
          onChange={(e) =>
            setFormData({ ...formData, inventory: e.target.value })
          }
          isRequired
        />
      </div>

      <div className="flex gap-4">
        <Select
          label="Category"
          placeholder="Select category"
          selectedKeys={[formData.category]}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
        >
          {categories.map((category) => (
            <SelectItem key={category.value}>{category.label}</SelectItem>
          ))}
        </Select>

        <Select
          label="Condition"
          placeholder="Select condition"
          selectedKeys={[formData.condition]}
          onChange={(e) =>
            setFormData({ ...formData, condition: e.target.value })
          }
        >
          {conditions.map((condition) => (
            <SelectItem key={condition.value}>{condition.label}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="flex gap-4">
        <Input
          label="SKU"
          placeholder="Enter SKU (optional)"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
        />

        <Input
          label="Brand"
          placeholder="Enter brand (optional)"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
        />
      </div>

      <Select
        label="Status"
        placeholder="Select status"
        selectedKeys={[formData.isActive ? "active" : "inactive"]}
        onChange={(e) =>
          setFormData({ ...formData, isActive: e.target.value === "active" })
        }
      >
        <SelectItem key="active">Active</SelectItem>
        <SelectItem key="inactive">Inactive</SelectItem>
      </Select>

      <div className="flex gap-2 justify-end mt-4">
        <Button color="default" variant="flat" onPress={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          color="primary"
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          {isLoading ? <Spinner size="sm" /> : "Update Product"}
        </Button>
      </div>
    </form>
  );
}
