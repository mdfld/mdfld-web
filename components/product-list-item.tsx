"use client";

import React from "react";
import { Image, Link } from "@heroui/react";

import { cn } from "@heroui/react";

export type ProductListItemProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "id"
> & {
  product: any;
  isPopular?: boolean;
  removeWrapper?: boolean;
};

const ProductListItem = React.forwardRef<HTMLDivElement, ProductListItemProps>(
  ({ product, isPopular, removeWrapper, className, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);

    // Format price to display
    const formatPrice = (price: any) => {
      const numPrice = typeof price === "string" ? parseFloat(price) : price;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numPrice);
    };

    // Get product image
    const productImage = product.images?.[0] || "/placeholder-product.svg";

    // Calculate discount percentage
    const discountPercentage = product.compareAtPrice
      ? Math.round(
          ((Number(product.compareAtPrice) - Number(product.price)) /
            Number(product.compareAtPrice)) *
            100,
        )
      : 0;

    return (
      <Link
        href={`/products/${product.id}`}
        className="block group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={ref}
          className={cn("relative flex w-full flex-col", className)}
          {...props}
        >
          {/* Product Image */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-default-100">
            <Image
              removeWrapper
              alt={product.title}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
              src={productImage}
            />

            {/* Hover Overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-black/60 transition-opacity duration-300 flex items-center justify-center",
                isHovered ? "opacity-100" : "opacity-0",
              )}
            >
              <p className="text-white font-medium">Quick View</p>
            </div>

            {/* Sale Badge */}
            {discountPercentage > 0 && (
              <div className="absolute top-3 left-3 bg-danger text-white text-xs font-bold px-2 py-1 rounded">
                -{discountPercentage}%
              </div>
            )}
          </div>

          {/* Product Info - Minimal */}
          <div className="pt-3 space-y-1">
            {/* Title */}
            <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.title}
            </h3>

            {/* Brand */}
            {product.brand && (
              <p className="text-xs text-default-500">{product.brand}</p>
            )}

            {/* Price */}
            <div className="flex items-center gap-2 pt-1">
              <p className="text-base font-semibold">
                {formatPrice(product.price)}
              </p>
              {product.compareAtPrice && (
                <p className="text-sm text-default-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  },
);

ProductListItem.displayName = "ProductListItem";

export default ProductListItem;
