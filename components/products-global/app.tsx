"use client";

import React from "react";
import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import FiltersWrapper from "./filters-wrapper";
import ecommerceItems from "./ecommerce-items";
import SidebarDrawer from "./sidebar-drawer";
import ProductsGrid from "./products-grid";

export default function Component() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="max-w-8xl h-full w-full px-4 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="my-8 text-center">
          <h1 className="text-4xl font-bold uppercase tracking-wide text-foreground">
            Authenticated Products
          </h1>
          <p className="mt-2 text-default-500">
            Every item verified by our expert team
          </p>
        </div>

        <nav className="mb-6">
          <Breadcrumbs>
            <BreadcrumbItem>Home</BreadcrumbItem>
            <BreadcrumbItem>All Products</BreadcrumbItem>
          </Breadcrumbs>
        </nav>

        <div className="flex gap-x-6">
          <SidebarDrawer isOpen={isOpen} onOpenChange={onOpenChange}>
            <FiltersWrapper
              className="bg-background"
              items={ecommerceItems}
              scrollShadowClassName="max-h-full pb-12"
              showActions={false}
              title="Filter by"
            />
          </SidebarDrawer>

          <div className="w-full flex-1 flex-col">
            <header className="mb-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    className="flex sm:hidden"
                    startContent={
                      <Icon
                        className="text-default-500"
                        height={16}
                        icon="solar:filter-linear"
                        width={16}
                      />
                    }
                    variant="bordered"
                    radius="full"
                    onPress={onOpen}
                  >
                    Filters
                  </Button>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">All Products</h2>
                    <span className="text-small text-default-400">
                      (9 items)
                    </span>
                  </div>
                </div>

                <Select
                  aria-label="Sort by"
                  classNames={{
                    base: "items-center justify-end",
                    label:
                      "hidden lg:block text-tiny whitespace-nowrap md:text-small text-default-400",
                    mainWrapper: "max-w-xs",
                  }}
                  defaultSelectedKeys={["most_popular"]}
                  label="Sort by"
                  labelPlacement="outside-left"
                  placeholder="Select an option"
                  variant="bordered"
                  radius="full"
                >
                  <SelectItem key="newest">Newest</SelectItem>
                  <SelectItem key="price_low_to_high">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem key="price_high_to_low">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem key="top_rated">Top Rated</SelectItem>
                  <SelectItem key="most_popular">Most Popular</SelectItem>
                </Select>
              </div>
            </header>

            <main className="w-full">
              <ProductsGrid className="grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
