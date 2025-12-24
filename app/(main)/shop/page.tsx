import { Metadata } from "next";
import ProductsPageClient from "../products/products-page-client";

export const metadata: Metadata = {
  title: "Shop - MDFLD Marketplace",
  description: "Browse our collection of authenticated football gear and merchandise",
};

export default function ShopPage() {
  return <ProductsPageClient />;
}
