"use client";

import React from "react";
import { Divider, ScrollShadow, Spinner } from "@heroui/react";
import ProductCard from "@/components/product-card";
import { trpc } from "@/lib/trpc-client";

export type RelatedProductsProps = {
  productId: string;
};

export default function RelatedProducts({ productId }: RelatedProductsProps) {
  const { data, isLoading } = trpc.product.getRelated.useQuery({
    id: productId,
  });
  const products = data ?? [];

  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 mb-8" aria-label="Related products">
      <h2 className="text-xl font-medium tracking-tight">You Might Also Like</h2>
      <Divider className="mt-4 mb-6" />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
        </div>
      ) : (
        <ScrollShadow orientation="horizontal" className="w-full snap-x">
          <div className="flex gap-6 py-2">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                product={product}
                disableImageBlur
                className="w-64 flex-none snap-start sm:w-72"
              />
            ))}
          </div>
        </ScrollShadow>
      )}
    </section>
  );
}
