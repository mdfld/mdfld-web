"use client";

import ProductsPageClient from "../products/products-page-client";
import { ShopOnboarding } from "./shop-onboarding";

export default function ShopPage() {
  return (
    <>
      <ShopOnboarding />
      <ProductsPageClient />
    </>
  );
}
