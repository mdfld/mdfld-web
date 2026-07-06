"use client";

import React from "react";
import { useParams } from "next/navigation";
import { BreadcrumbItem, Breadcrumbs, Spinner } from "@heroui/react";
import ProductViewInfo from "@/components/product-layout/product-view-item";
import RelatedProducts from "@/components/product-layout/related-products";
import { trpc } from "@/lib/trpc-client";
import {
  getCategoryGroup,
  FOOTBALL_CONDITION_LABELS,
  BALL_SIZE_LABELS,
  BALL_GRADES,
} from "@/lib/constants/product-categories";

function buildShippingItems(product: any): string[] {
  const items: string[] = [];

  const shipsFrom =
    product.shipsFromCountry ?? product.seller.organization?.shipsFromCountry;
  if (shipsFrom) items.push(`Ships from: ${shipsFrom}`);

  if (product.shippingCarrier && product.estimatedDeliveryDays) {
    items.push(`${product.shippingCarrier} · Up to ${product.estimatedDeliveryDays} days`);
  } else if (product.shippingCarrier) {
    items.push(`Carrier: ${product.shippingCarrier}`);
  } else if (product.estimatedDeliveryDays) {
    items.push(`Estimated delivery: up to ${product.estimatedDeliveryDays} days`);
  }

  if (product.shippingTerms === "INCLUDED_DDP") {
    items.push("Shipping & duties included — no extra charges at delivery");
  } else {
    items.push("Shipping calculated at checkout");
  }

  return items.length > 1
    ? items
    : ["Standard shipping available. Contact seller for details."];
}

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

  // tRPC type inference drops relation fields at this depth — cast once here
  const p: any = product;

  const categoryGroup = getCategoryGroup(p.category);

  const conditionLabel =
    categoryGroup === 'FOOTBALL'
      ? (FOOTBALL_CONDITION_LABELS[p.condition] ?? p.condition.replace(/_/g, ' ').toLowerCase())
      : p.condition?.replace(/_/g, ' ').toLowerCase() ?? 'New';

  const attributes: string[] = [
    `Category: ${p.category.replace(/_/g, ' ').toLowerCase()}`,
    `Condition: ${conditionLabel}`,
    `Brand: ${p.brand || 'Generic'}`,
  ];

  if (categoryGroup === 'COLLECTIBLE') {
    if (p.setName) attributes.push(`Set: ${p.setName}`);
    if (p.collectibleCode) attributes.push(`Code: ${p.collectibleCode}`);
    if (p.collectiblePublisher) attributes.push(`Publisher: ${p.collectiblePublisher}`);
    if (p.collectiblePlayerName) attributes.push(`Player: ${p.collectiblePlayerName}`);
    if (p.collectibleTeam) attributes.push(`Team: ${p.collectibleTeam}`);
  } else if (categoryGroup === 'FOOTBALL') {
    if (p.ballSize) attributes.push(`Size: ${p.ballSize} - ${BALL_SIZE_LABELS[p.ballSize]}`);
    if (p.ballGrade) {
      const gradeLabel = BALL_GRADES.find(g => g.key === p.ballGrade)?.label ?? p.ballGrade;
      attributes.push(`Grade: ${gradeLabel}`);
    }
  } else {
    // Wearable-specific attributes
    if (p.tier) attributes.push(`Tier: ${p.tier}`);
    if (p.year) attributes.push(`Year: ${p.year}`);
    if (p.season) attributes.push(`Season: ${p.season}`);
  }

  // Transform variants data
  const sizes: string[] =
    p.hasVariants && p.variants
      ? (Array.from(
          new Set(p.variants.map((v: any) => v.sizeDisplay)),
        ).sort() as string[])
      : ["One Size"];

  const uniqueColors = new Map<string, { name: string; hex: string }>();
  if (p.hasVariants && p.variants) {
    p.variants.forEach((v: any) => {
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
  const allImages = Array.isArray(p.images) ? [...p.images] : [];
  if (p.hasVariants && p.variants) {
    p.variants.forEach((variant: any) => {
      if (variant.images && variant.images.length > 0) {
        allImages.push(...variant.images);
      }
    });
  }

  // Remove duplicates
  const uniqueImages = [...new Set(allImages)];

  // Transform the product data to match the ProductViewItem interface
  const productViewItem = {
    id: p.id,
    name: p.title,
    description: p.description,
    images:
      uniqueImages.length > 0
        ? uniqueImages
        : [
            "https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/shoes/product-view/1.jpeg",
          ],
    price:
      p.hasVariants && p.variants.length > 0
        ? Math.min(
            ...p.variants.map((v: any) => parseFloat(v.price.toString())),
          )
        : parseFloat(p.price.toString()),
    rating: p.seller.averageRating || 4.5,
    ratingCount: p.reviews?.length || 0,
    sizes: sizes,
    isPopular: p.featured,
    availableColors:
      colors.length > 0 ? colors : [{ name: "Default", hex: "#808080" }],
    hasVariants: p.hasVariants,
    variants: p.variants,
    seller: p.seller,
    sellerId: p.seller?.userId ?? p.seller?.organization?.members?.[0]?.userId,
    tradeEnabled: p.tradeEnabled ?? false,
    verificationStatus: p.verificationStatus,
    details: [
      {
        title: "Product Details",
        items: attributes,
      },
      {
        title: "Seller Information",
        items: [
          `Store: ${p.seller.storeName}`,
          `Rating: ${p.seller.averageRating || "N/A"} stars`,
          `Total Sales: ${p.seller.totalSales}`,
        ],
      },
      {
        title: "Shipping",
        items: buildShippingItems(p),
      },
      {
        title: "Returns",
        items: p.seller.returnPolicy
          ? p.seller.returnPolicy
              .split("\n")
              .filter((line: string) => line.trim())
          : ["No returns except for items not as described or authenticity disputes"],
      },
    ],
  };

  // Get category breadcrumb
  const categoryName = p.category.replace(/_/g, " ").toLowerCase();

  return (
    <div className="max-w-8xl h-full w-full px-4 md:px-8 lg:px-24 pt-4">
      <nav className="my-4 py-2">
        <Breadcrumbs>
          <BreadcrumbItem href="/">Home</BreadcrumbItem>
          <BreadcrumbItem href="/products">Products</BreadcrumbItem>
          <BreadcrumbItem className="capitalize">{categoryName}</BreadcrumbItem>
          <BreadcrumbItem>{p.title}</BreadcrumbItem>
        </Breadcrumbs>
      </nav>
      {categoryGroup === 'COLLECTIBLE' && p.isPeeled && (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          Peeled
        </span>
      )}
      <ProductViewInfo {...productViewItem} />
      <RelatedProducts productId={p.id} />
    </div>
  );
}
