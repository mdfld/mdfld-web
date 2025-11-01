"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import {
  Card,
  CardBody,
  CardFooter,
  Chip,
  Image,
  Input,
  Select,
  SelectItem,
  Button,
  Skeleton,
  Pagination,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { PRODUCT_CATEGORIES } from "@/server/routers/product";

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
}

export function ProductListing() {
  const [filters, setFilters] = useState<ProductFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const limit = 12;

  // Fetch products with filters
  const { data, isLoading } = trpc.product.search.useQuery({
    query: filters.searchQuery,
    category: filters.category,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    limit,
    cursor: undefined, // For now, using simple pagination
  });

  // Category list
  const categoryOptions = Object.entries(PRODUCT_CATEGORIES).map(
    ([key, value]) => ({
      key,
      label: value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (l: any) => l.toUpperCase()),
    }),
  );

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, searchQuery: searchInput }));
    setCurrentPage(1);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      category: value === "all" ? undefined : value,
    }));
    setCurrentPage(1);
  };

  const handlePriceFilter = (min?: number, max?: number) => {
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput("");
    setCurrentPage(1);
  };

  const formatPrice = (price: number | { toNumber: () => number }) => {
    const numPrice = typeof price === "number" ? price : price.toNumber();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numPrice);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="w-full">
              <Skeleton className="rounded-lg">
                <div className="h-48 rounded-lg bg-default-300"></div>
              </Skeleton>
              <CardBody className="space-y-3">
                <Skeleton className="w-3/5 rounded-lg">
                  <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
                </Skeleton>
                <Skeleton className="w-4/5 rounded-lg">
                  <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
                </Skeleton>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Filters Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              startContent={<Icon icon="solar:magnifer-outline" width={20} />}
              endContent={
                searchInput && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => {
                      setSearchInput("");
                      setFilters((prev) => ({
                        ...prev,
                        searchQuery: undefined,
                      }));
                    }}
                  >
                    <Icon icon="solar:close-circle-outline" width={20} />
                  </Button>
                )
              }
            />
          </div>

          {/* Category Filter */}
          <Select
            aria-label="Filter by category"
            placeholder="All Categories"
            className="w-full md:w-[200px]"
            onChange={handleCategoryChange}
            selectedKeys={filters.category ? [filters.category] : []}
            items={[
              { key: "all", label: "All Categories" },
              ...categoryOptions,
            ]}
          >
            {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
          </Select>

          {/* Price Range Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={
                !filters.minPrice && !filters.maxPrice ? "solid" : "bordered"
              }
              onPress={() => handlePriceFilter(undefined, undefined)}
            >
              All Prices
            </Button>
            <Button
              size="sm"
              variant={filters.maxPrice === 50 ? "solid" : "bordered"}
              onPress={() => handlePriceFilter(0, 50)}
            >
              Under $50
            </Button>
            <Button
              size="sm"
              variant={
                filters.minPrice === 50 && filters.maxPrice === 100
                  ? "solid"
                  : "bordered"
              }
              onPress={() => handlePriceFilter(50, 100)}
            >
              $50 - $100
            </Button>
            <Button
              size="sm"
              variant={filters.minPrice === 100 ? "solid" : "bordered"}
              onPress={() => handlePriceFilter(100, undefined)}
            >
              Over $100
            </Button>
          </div>

          {/* Search Button */}
          <Button color="primary" onPress={handleSearch}>
            Search
          </Button>

          {/* Clear Filters */}
          {Object.keys(filters).length > 0 && (
            <Button variant="light" onPress={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery && (
              <Chip
                onClose={() =>
                  setFilters((prev) => ({ ...prev, searchQuery: undefined }))
                }
                variant="flat"
              >
                Search: {filters.searchQuery}
              </Chip>
            )}
            {filters.category && (
              <Chip
                onClose={() =>
                  setFilters((prev) => ({ ...prev, category: undefined }))
                }
                variant="flat"
              >
                {categoryOptions.find((c) => c.key === filters.category)?.label}
              </Chip>
            )}
            {(filters.minPrice !== undefined ||
              filters.maxPrice !== undefined) && (
              <Chip
                onClose={() => handlePriceFilter(undefined, undefined)}
                variant="flat"
              >
                Price: {filters.minPrice ? `$${filters.minPrice}` : "0"} -{" "}
                {filters.maxPrice ? `$${filters.maxPrice}` : "∞"}
              </Chip>
            )}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {data?.items && data.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.items.map((product: any) => (
              <Card
                key={product.id}
                isPressable
                onPress={() =>
                  (window.location.href = `/products/${product.id}`)
                }
                className="w-full hover:scale-105 transition-transform"
              >
                <CardBody className="p-0">
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                      removeWrapper
                    />
                  ) : (
                    <div className="w-full h-48 bg-default-100 flex items-center justify-center">
                      <Icon
                        icon="solar:gallery-bold"
                        className="text-default-400"
                        width={48}
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-sm text-default-500 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold">
                          {formatPrice(product.price)}
                        </p>
                        {product.compareAtPrice && (
                          <p className="text-sm text-default-400 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </p>
                        )}
                      </div>
                      {product.inventory === 0 && (
                        <Chip size="sm" color="danger" variant="flat">
                          Out of Stock
                        </Chip>
                      )}
                    </div>
                  </div>
                </CardBody>
                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2 text-sm text-default-500">
                    <Icon icon="solar:shop-bold" width={16} />
                    <span>{product.seller.storeName}</span>
                    {product.seller.averageRating > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Icon
                            icon="solar:star-bold"
                            className="text-warning"
                            width={16}
                          />
                          <span>{product.seller.averageRating.toFixed(1)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination - simple for now */}
          {data.items.length === limit && (
            <div className="mt-8 flex justify-center">
              <Pagination
                total={10} // You'd calculate this based on total results
                page={currentPage}
                onChange={setCurrentPage}
                showControls
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Icon
            icon="solar:box-outline"
            className="mx-auto text-default-300 mb-4"
            width={64}
          />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-default-500">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}
