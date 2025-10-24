"use client";

import React from "react";
import { cn } from "@heroui/react";
import ProductCard from "@/components/product-card";

export type ProductGridProps = React.HTMLAttributes<HTMLDivElement> & {
  products: any[];
  itemClassName?: string;
};

const ProductsGrid = React.forwardRef<HTMLDivElement, ProductGridProps>(
  ({ products, itemClassName, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          className,
        )}
        {...props}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            className={cn("w-full", itemClassName)}
          />
        ))}
      </div>
    );
  },
);

ProductsGrid.displayName = "ProductsGrid";

export default ProductsGrid;
