import { Metadata } from "next";
import { Suspense } from "react";
import ProductsPageClient from "./products-page-client";

export const metadata: Metadata = {
  title: "Products - MDFLD Marketplace",
  description: "Browse our collection of authenticated products",
};

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageClient />
    </Suspense>
  );
}
