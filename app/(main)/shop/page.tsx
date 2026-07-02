"use client";

import { Suspense } from "react";
import ProductsPageClient from "../products/products-page-client";
import { ShopOnboarding } from "./shop-onboarding";

export default function ShopPage() {
  return (
    <>
      <ShopOnboarding />
      <Suspense>
        <ProductsPageClient />
      </Suspense>
    </>
  );
}
