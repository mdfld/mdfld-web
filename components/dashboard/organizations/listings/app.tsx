"use client";

import React, { useState } from "react";
import {
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { useOrganizationStore } from "@/lib/stores/organization";
import { useRouter } from "next/navigation";
import ProductCreation from "../products/create/product-creation";
import EditProductForm from "./edit-product-form";

const categories = [
  { key: "all", label: "All" },
  { key: "JERSEYS", label: "Jerseys" },
  { key: "CLEATS", label: "Cleats" },
  { key: "TRAINING_GEAR", label: "Training Gear" },
  { key: "SPORTS_EQUIPMENT", label: "Sports Equipment" },
  { key: "ATHLETIC_ACCESSORIES", label: "Athletic Accessories" },
  { key: "TEAM_MERCHANDISE", label: "Team Merchandise" },
  { key: "FAN_GEAR", label: "Fan Gear" },
  { key: "COLLECTIBLES", label: "Collectibles" },
  { key: "MEMORABILIA", label: "Memorabilia" },
  { key: "CASUAL_WEAR", label: "Casual Wear" },
  { key: "OUTERWEAR", label: "Outerwear" },
  { key: "HEADWEAR", label: "Headwear" },
  { key: "FOOTWEAR", label: "Footwear" },
  { key: "BAGS_BACKPACKS", label: "Bags & Backpacks" },
  { key: "SPORTS_ACCESSORIES", label: "Sports Accessories" },
  { key: "ELECTRONICS", label: "Electronics" },
  { key: "TRAINING_EQUIPMENT", label: "Training Equipment" },
  { key: "PROTECTIVE_GEAR", label: "Protective Gear" },
  { key: "MAINTENANCE_SUPPLIES", label: "Maintenance Supplies" },
  { key: "GIFT_CARDS", label: "Gift Cards" },
  { key: "DIGITAL_PRODUCTS", label: "Digital Products" },
  { key: "OTHER", label: "Other" },
];

export default function OrganizationListingsLayout() {
  const router = useRouter();
  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const rowsPerPage = 10;

  // Fetch seller profile
  const { data: sellerProfileData } =
    trpc.organization.getSellerProfile.useQuery(
      {
        organizationId: activeOrganization?.id || "",
      },
      {
        enabled: !!activeOrganization?.id,
      },
    );

  // Fetch products
  const {
    data: productsData,
    isLoading,
    refetch,
  } = trpc.organization.getProducts.useQuery(
    {
      organizationId: activeOrganization?.id || "",
      limit: rowsPerPage,
      cursor: undefined,
      category: selectedCategory === "all" ? undefined : selectedCategory,
      status: selectedStatus as any,
      search: searchQuery || undefined,
    },
    {
      enabled: !!activeOrganization?.id,
    },
  );

  // Delete product mutation
  const deleteProductMutation = trpc.product.delete.useMutation({
    onSuccess: () => {
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      refetch();
    },
  });

  const handleCreateProduct = () => {
    setIsCreateModalOpen(true);
  };

  const handleDeleteProduct = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate({
        id: selectedProduct.id,
      });
    }
  };

  const products = productsData?.items || [];
  const filteredProducts = products;

  const pages = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginatedListings = filteredProducts.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const stats = {
    total: products.length,
    active: products.filter((p: any) => p.isActive).length,
    totalInventory: products.reduce(
      (sum: any, product: any) => sum + product.inventory,
      0,
    ),
    totalRevenue: 0, // Would need orders data
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium">Products</h1>
          <p className="text-sm text-default-500 mt-1">
            Manage your product inventory
          </p>
        </div>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={
            <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
          }
          onPress={handleCreateProduct}
        >
          Add Product
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-sm text-default-500">Total Products</p>
          <p className="text-2xl font-medium mt-1">{stats.total}</p>
        </div>
        <div>
          <p className="text-sm text-default-500">Active</p>
          <p className="text-2xl font-medium mt-1">{stats.active}</p>
        </div>
        <div>
          <p className="text-sm text-default-500">In Stock</p>
          <p className="text-2xl font-medium mt-1">{stats.totalInventory}</p>
        </div>
        <div>
          <p className="text-sm text-default-500">Revenue</p>
          <p className="text-2xl font-medium mt-1">
            ${stats.totalRevenue.toFixed(0)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={
              <Icon
                icon="solar:magnifer-linear"
                className="w-4 h-4 text-default-400"
              />
            }
            className="max-w-sm"
            size="sm"
            variant="bordered"
          />
          <Select
            placeholder="Category"
            selectedKeys={[selectedCategory]}
            onSelectionChange={(keys) =>
              setSelectedCategory(Array.from(keys)[0] as string)
            }
            size="sm"
            className="max-w-[200px]"
            variant="bordered"
          >
            {categories.map((category) => (
              <SelectItem key={category.key}>{category.label}</SelectItem>
            ))}
          </Select>
          <Select
            placeholder="Status"
            selectedKeys={[selectedStatus]}
            onSelectionChange={(keys) =>
              setSelectedStatus(Array.from(keys)[0] as string)
            }
            size="sm"
            className="max-w-[150px]"
            variant="bordered"
          >
            <SelectItem key="all">All</SelectItem>
            <SelectItem key="active">Active</SelectItem>
            <SelectItem key="draft">Draft</SelectItem>
            <SelectItem key="archived">Archived</SelectItem>
          </Select>
        </div>

        <Table
          aria-label="Product listings table"
          className="min-h-[400px]"
          classNames={{
            base: "max-w-full",
            table: "min-h-[100px]",
            wrapper: "shadow-none border-none bg-transparent p-0",
            td: "py-3",
            th: "bg-transparent text-default-500 font-normal text-xs",
          }}
          bottomContent={
            pages > 1 && (
              <div className="flex w-full justify-center py-4">
                <Pagination
                  isCompact
                  showControls
                  color="default"
                  variant="light"
                  page={page}
                  total={pages}
                  onChange={setPage}
                />
              </div>
            )
          }
        >
          <TableHeader>
            <TableColumn>PRODUCT</TableColumn>
            <TableColumn>PRICE</TableColumn>
            <TableColumn>STOCK</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn> </TableColumn>
          </TableHeader>
          <TableBody emptyContent="No products found">
            {paginatedListings.map((product: any) => {
              const categoryName =
                categories.find((c) => c.key === product.category)?.label ||
                product.category;

              return (
                <TableRow
                  key={product.id}
                  className="hover:bg-default-50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={product.images?.[0] || ""}
                        radius="sm"
                        size="sm"
                        className="w-10 h-10"
                        fallback={
                          <Icon icon="solar:box-linear" className="w-6 h-6" />
                        }
                      />
                      <div>
                        <p className="text-sm font-medium">{product.title}</p>
                        <p className="text-xs text-default-400 capitalize">
                          {categoryName}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">
                      ${product.price.toString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          product.inventory === 0
                            ? "bg-danger"
                            : product.inventory < 5
                              ? "bg-warning"
                              : "bg-success"
                        }`}
                      />
                      <span className="text-sm">{product.inventory}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="sm"
                      variant="dot"
                      color={product.isActive ? "success" : "default"}
                      classNames={{
                        base: "border-none",
                        content: "text-xs",
                      }}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="w-8 h-8"
                        onPress={() => router.push(`/products/${product.id}`)}
                      >
                        <Icon icon="solar:eye-linear" className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="w-8 h-8"
                        onPress={() => {
                          setSelectedProduct(product);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Icon icon="solar:pen-2-linear" className="w-4 h-4" />
                      </Button>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="w-8 h-8"
                          >
                            <Icon
                              icon="solar:menu-dots-bold"
                              className="w-4 h-4"
                            />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Product actions">
                          <DropdownItem key="duplicate">Duplicate</DropdownItem>
                          <DropdownItem key="archive">Archive</DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            onPress={() => {
                              setSelectedProduct(product);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        size="full"
        hideCloseButton
        classNames={{
          base: "!rounded-none !m-0 !max-h-none",
          wrapper: "!rounded-none",
          backdrop: "!rounded-none",
          body: "!rounded-none",
        }}
      >
        <ModalContent>
          {() => (
            <ModalBody className="p-0">
              {sellerProfileData ? (
                <ProductCreation
                  sellerProfileId={sellerProfileData.id}
                  organizationId={activeOrganization?.id || ""}
                  onComplete={() => {
                    setIsCreateModalOpen(false);
                    refetch();
                  }}
                  onClose={() => setIsCreateModalOpen(false)}
                />
              ) : (
                <div className="flex items-center justify-center h-96">
                  <Spinner size="lg" />
                </div>
              )}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Edit Product
              </ModalHeader>
              <ModalBody>
                {selectedProduct ? (
                  <EditProductForm
                    product={selectedProduct}
                    onComplete={() => {
                      setIsEditModalOpen(false);
                      refetch();
                    }}
                    onClose={() => setIsEditModalOpen(false)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <Spinner size="lg" />
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Delete Product
              </ModalHeader>
              <ModalBody>
                <p>
                  Are you sure you want to delete "{selectedProduct?.title}"?
                  This action cannot be undone.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="flat" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteProduct}
                  isLoading={deleteProductMutation.isPending}
                >
                  Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
