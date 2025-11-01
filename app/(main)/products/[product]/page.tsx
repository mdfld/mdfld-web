"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BreadcrumbItem, Breadcrumbs, Spinner } from "@heroui/react";
import ProductViewInfo from "@/components/product-layout/product-view-item";
import { trpc } from "@/lib/trpc-client";

export default function ProductPage() {
  const params = useParams();
  const productId = params.product as string;

  const {
    data: product,
    isLoading,
    error,
  } = trpc.product.getById.useQuery({
    id: productId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-default-500">Product not found</p>
      </div>
    );
  }

  // Transform variants data
  const sizes: string[] =
    product.hasVariants && product.variants
      ? (Array.from(
          new Set(product.variants.map((v: any) => v.sizeDisplay)),
        ).sort() as string[])
      : ["One Size"];

  const uniqueColors = new Map<string, { name: string; hex: string }>();
  if (product.hasVariants && product.variants) {
    product.variants.forEach((v: any) => {
      if (v.color && !uniqueColors.has(v.color)) {
        uniqueColors.set(v.color, {
          name: v.color,
          hex: v.colorHex || "#808080",
        });
      }
    });
  }
  const colors = Array.from(uniqueColors.values());

  // Get all variant images
  const allImages = Array.isArray(product.images) ? [...product.images] : [];
  if (product.hasVariants && product.variants) {
    product.variants.forEach((variant: any) => {
      if (variant.images && variant.images.length > 0) {
        allImages.push(...variant.images);
      }
    });
  }

  // Remove duplicates
  const uniqueImages = [...new Set(allImages)];

  // Transform the product data to match the ProductViewItem interface
  const productViewItem = {
    id: product.id,
    name: product.title,
    description: product.description,
    images:
      uniqueImages.length > 0
        ? uniqueImages
        : [
            "https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/shoes/product-view/1.jpeg",
          ],
    price:
      product.hasVariants && product.variants.length > 0
        ? Math.min(
            ...product.variants.map((v: any) => parseFloat(v.price.toString())),
          )
        : parseFloat(product.price.toString()),
    rating: product.seller.averageRating || 4.5,
    ratingCount: product.reviews.length || 0,
    sizes: sizes,
    isPopular: product.featured,
    availableColors:
      colors.length > 0 ? colors : [{ name: "Default", hex: "#808080" }],
    hasVariants: product.hasVariants,
    variants: product.variants,
    seller: product.seller,
    details: [
      {
        title: "Product Details",
        items: [
          `Category: ${product.category.replace(/_/g, " ").toLowerCase()}`,
          `Condition: ${product.condition?.replace(/_/g, " ").toLowerCase() || "New"}`,
          `Brand: ${product.brand || "Generic"}`,
          `SKU: ${product.sku || product.id}`,
          ...(product.year ? [`Year: ${product.year}`] : []),
          ...(product.soleplateType
            ? [`Soleplate: ${product.soleplateType}`]
            : []),
          ...(product.tier ? [`Tier: ${product.tier}`] : []),
          ...(product.material ? [`Material: ${product.material}`] : []),
        ].filter(Boolean),
      },
      {
        title: "Seller Information",
        items: [
          `Store: ${product.seller.storeName}`,
          `Rating: ${product.seller.averageRating || "N/A"} stars`,
          `Total Sales: ${product.seller.totalSales}`,
        ],
      },
      {
        title: "Shipping & Returns",
        items: product.seller.shippingPolicy
          ? product.seller.shippingPolicy
              .split("\n")
              .filter((line: string) => line.trim())
          : ["Standard shipping available", "Contact seller for details"],
      },
      {
        title: "Return Policy",
        items: product.seller.returnPolicy
          ? product.seller.returnPolicy
              .split("\n")
              .filter((line: string) => line.trim())
          : ["Returns accepted within 30 days", "Contact seller for details"],
      },
    ],
  };

  // Get category breadcrumb
  const categoryName = product.category.replace(/_/g, " ").toLowerCase();

  return (
    <div className="max-w-8xl h-full w-full px-2 lg:px-24">
      <nav className="my-4 py-2">
        <Breadcrumbs>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem href="/products">Products</BreadcrumbItem>
          <BreadcrumbItem className="capitalize">{categoryName}</BreadcrumbItem>
          <BreadcrumbItem>{product.title}</BreadcrumbItem>
        </Breadcrumbs>
      </nav>
      <ProductViewInfo {...productViewItem} />
    </div>
  );
}
