"use client";

import React from "react";
import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Select,
  SelectItem,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import ProductsGrid from "@/components/products-grid";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from "@heroui/react";
import ProductFilters from "@/components/product-filters";

export default function ProductsPageClient() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [sortBy, setSortBy] = React.useState<string>("newest");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    [],
  );
  const [priceRange, setPriceRange] = React.useState<number[]>([0, 5000]);
  const [selectedConditions, setSelectedConditions] = React.useState<string[]>(
    [],
  );

  // Fetch products using tRPC
  const { data, isLoading, fetchNextPage, hasNextPage } =
    trpc.product.search.useInfiniteQuery(
      {
        limit: 20,
        category:
          selectedCategories.length > 0 ? selectedCategories[0] : undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1] < 5000 ? priceRange[1] : undefined,
      },
      {
        getNextPageParam: (lastPage: any) => lastPage.nextCursor,
      },
    ) as any;

  // Flatten all pages of products
  const products = React.useMemo(() => {
    return (data?.pages as any[])?.flatMap((page: any) => page.items) ?? [];
  }, [data]);

  // Sort products based on selected option
  const sortedProducts = React.useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case "price_low_to_high":
        return sorted.sort((a, b) => Number(a.price) - Number(b.price));
      case "price_high_to_low":
        return sorted.sort((a, b) => Number(b.price) - Number(a.price));
      case "newest":
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  }, [products, sortBy]);

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Mobile Filters Drawer - Only visible on mobile */}
      <Drawer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="left"
        size="xs"
      >
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Filters</h2>
          </DrawerHeader>
          <DrawerBody>
            <ProductFilters
              onFiltersChange={(filters) => {
                if (filters.categories)
                  setSelectedCategories(filters.categories);
                if (filters.priceRange) setPriceRange(filters.priceRange);
                if (filters.conditions)
                  setSelectedConditions(filters.conditions);
              }}
              onReset={() => {
                setSelectedCategories([]);
                setPriceRange([0, 5000]);
                setSelectedConditions([]);
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Page Content */}
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <Breadcrumbs size="sm">
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem>Products</BreadcrumbItem>
          </Breadcrumbs>
        </nav>

        {/* Main Layout: Filters Left, Products Right */}
        <div className="flex gap-8">
          {/* Desktop Filters - Left Side */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                onFiltersChange={(filters) => {
                  if (filters.categories)
                    setSelectedCategories(filters.categories);
                  if (filters.priceRange) setPriceRange(filters.priceRange);
                  if (filters.conditions)
                    setSelectedConditions(filters.conditions);
                }}
                onReset={() => {
                  setSelectedCategories([]);
                  setPriceRange([0, 5000]);
                  setSelectedConditions([]);
                }}
              />
            </div>
          </aside>

          {/* Products Section - Right Side */}
          <div className="flex-1">
            {/* Mobile Filter Button & Sort */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  className="lg:hidden"
                  startContent={
                    <Icon
                      className="text-default-500"
                      height={18}
                      icon="solar:filter-linear"
                      width={18}
                    />
                  }
                  variant="flat"
                  size="sm"
                  onPress={onOpen}
                >
                  Filters
                </Button>

                <p className="text-sm text-default-500">
                  {products.length} products
                </p>
              </div>

              <Select
                aria-label="Sort by"
                classNames={{
                  base: "max-w-xs",
                  trigger: "h-9 min-h-9",
                }}
                selectedKeys={[sortBy]}
                onSelectionChange={(keys) =>
                  setSortBy(Array.from(keys)[0] as string)
                }
                placeholder="Sort by"
                variant="bordered"
                size="sm"
              >
                <SelectItem key="newest">Newest First</SelectItem>
                <SelectItem key="price_low_to_high">
                  Price: Low to High
                </SelectItem>
                <SelectItem key="price_high_to_low">
                  Price: High to Low
                </SelectItem>
              </Select>
            </div>

            {/* Product Grid */}
            <main className="w-full">
              {isLoading ? (
                <div className="flex h-[60vh] items-center justify-center">
                  <Spinner size="lg" color="primary" />
                </div>
              ) : sortedProducts.length > 0 ? (
                <>
                  <ProductsGrid
                    products={sortedProducts}
                    className="grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3"
                  />
                  {hasNextPage && (
                    <div className="mt-16 flex justify-center">
                      <Button
                        variant="bordered"
                        radius="full"
                        size="lg"
                        className="px-8"
                        onPress={() => fetchNextPage()}
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-[60vh] flex-col items-center justify-center">
                  <div className="rounded-full bg-default-100 p-4 mb-4">
                    <Icon
                      icon="solar:box-linear"
                      width={48}
                      height={48}
                      className="text-default-400"
                    />
                  </div>
                  <p className="text-lg font-medium">No products found</p>
                  <p className="text-sm text-default-500 mt-1">
                    Try adjusting your filters or check back later
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
