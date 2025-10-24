"use client";

import React from "react";
import { Chip, Image } from "@heroui/react";
import { ProductFormData } from "./product-creation";

interface ProductReviewFormProps {
  data: Partial<ProductFormData>;
}

const getCategoryLabel = (key: string) => {
  const categories: Record<string, string> = {
    JERSEYS: "Jerseys",
    CLEATS: "Cleats",
    TRAINING_GEAR: "Training Gear",
    SPORTS_EQUIPMENT: "Sports Equipment",
    ATHLETIC_ACCESSORIES: "Athletic Accessories",
    TEAM_MERCHANDISE: "Team Merchandise",
    FAN_GEAR: "Fan Gear",
    COLLECTIBLES: "Collectibles",
    MEMORABILIA: "Memorabilia",
    CASUAL_WEAR: "Casual Wear",
    OUTERWEAR: "Outerwear",
    HEADWEAR: "Headwear",
    FOOTWEAR: "Footwear",
    BAGS_BACKPACKS: "Bags & Backpacks",
    SPORTS_ACCESSORIES: "Sports Accessories",
    ELECTRONICS: "Electronics",
    TRAINING_EQUIPMENT: "Training Equipment",
    PROTECTIVE_GEAR: "Protective Gear",
    MAINTENANCE_SUPPLIES: "Maintenance Supplies",
    GIFT_CARDS: "Gift Cards",
    DIGITAL_PRODUCTS: "Digital Products",
    OTHER: "Other",
  };
  return categories[key] || key;
};

const getConditionLabel = (key: string) => {
  const conditions: Record<string, string> = {
    BRAND_NEW: "Brand New",
    NEW_WITH_TAGS: "New with Tags",
    NEW_WITHOUT_TAGS: "New without Tags",
    USED_LIKE_NEW: "Used - Like New",
    USED_GOOD: "Used - Good",
    USED_FAIR: "Used - Fair",
  };
  return conditions[key] || key;
};

export default function ProductReviewForm({ data }: ProductReviewFormProps) {
  const platformFee = 0.1;
  const sellerReceives = data.price ? data.price * (1 - platformFee) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-default-foreground">
          Review Your Listing
        </h2>
        <p className="text-sm text-default-500 mt-1">
          Confirm all details are correct before listing
        </p>
      </div>

      <div className="space-y-8">
        {/* Images */}
        <div>
          <h3 className="text-sm font-medium text-default-700 mb-3">
            Product Images
          </h3>
          {data.images && data.images.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {data.images.map((image, index) => (
                <Image
                  key={index}
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-xl flex-shrink-0 border border-default-200"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-default-400">No images uploaded</p>
          )}
        </div>

        {/* Basic Info Grid */}
        <div>
          <h3 className="text-sm font-medium text-default-700 mb-3">
            Product Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-default-500">Product Name</span>
              <p className="text-sm font-medium mt-1">{data.name || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-default-500">Category</span>
              <p className="text-sm font-medium mt-1">
                {data.category ? getCategoryLabel(data.category) : "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-default-500">Condition</span>
              <p className="text-sm font-medium mt-1">
                {data.condition ? getConditionLabel(data.condition) : "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-default-500">SKU</span>
              <p className="text-sm font-medium mt-1">{data.sku || "—"}</p>
            </div>
          </div>
          {data.description && (
            <div className="mt-4">
              <span className="text-xs text-default-500">Description</span>
              <p className="text-sm mt-1 text-default-700">
                {data.description}
              </p>
            </div>
          )}
        </div>

        {/* Specifications */}
        {(data.brand ||
          data.model ||
          data.size ||
          data.color ||
          data.material ||
          data.weight) && (
          <div>
            <h3 className="text-sm font-medium text-default-700 mb-3">
              Specifications
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {data.brand && (
                <div>
                  <span className="text-xs text-default-500">Brand</span>
                  <p className="text-sm font-medium mt-1">{data.brand}</p>
                </div>
              )}
              {data.model && (
                <div>
                  <span className="text-xs text-default-500">Model</span>
                  <p className="text-sm font-medium mt-1">{data.model}</p>
                </div>
              )}
              {data.size && (
                <div>
                  <span className="text-xs text-default-500">Size</span>
                  <p className="text-sm font-medium mt-1">{data.size}</p>
                </div>
              )}
              {data.color && (
                <div>
                  <span className="text-xs text-default-500">Color</span>
                  <p className="text-sm font-medium mt-1">{data.color}</p>
                </div>
              )}
              {data.material && (
                <div>
                  <span className="text-xs text-default-500">Material</span>
                  <p className="text-sm font-medium mt-1">{data.material}</p>
                </div>
              )}
              {data.weight && (
                <div>
                  <span className="text-xs text-default-500">Weight</span>
                  <p className="text-sm font-medium mt-1">{data.weight} kg</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-default-700 mb-4">
            Pricing & Inventory
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-600">Listing Price</span>
              <span className="text-2xl font-semibold">
                ${data.price?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Platform Fee (10%)</span>
              <span className="text-default-500">
                -${((data.price || 0) * platformFee).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm font-medium">Your Earnings</span>
              <span className="text-lg font-semibold text-success">
                ${sellerReceives.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-sm text-default-600">
                Available Quantity
              </span>
              <span className="text-sm font-medium">
                {data.quantity || 0} units
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-default-700 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, index) => (
                <Chip key={index} size="sm" variant="flat">
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
