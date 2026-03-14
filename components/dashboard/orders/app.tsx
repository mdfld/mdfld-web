"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Spinner,
  Card,
  CardBody,
  Image,
  Link,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { format } from "date-fns";

const orderStatuses = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
];

const statusConfig = {
  PENDING: { color: "warning", label: "Pending" },
  CONFIRMED: { color: "primary", label: "Confirmed" },
  PROCESSING: { color: "primary", label: "Processing" },
  SHIPPED: { color: "secondary", label: "Shipped" },
  DELIVERED: { color: "success", label: "Delivered" },
  CANCELLED: { color: "danger", label: "Cancelled" },
  REFUNDED: { color: "default", label: "Refunded" },
};

export default function UserOrdersLayout() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const { data: ordersData, isLoading } = (
    trpc as any
  ).order.getMyOrders.useQuery({
    limit: rowsPerPage,
    status: selectedStatus as any,
    cursor: undefined,
  });

  const cancelOrderMutation = (trpc as any).order.cancel.useMutation({
    onSuccess: () => {
      // Refetch orders
    },
  });

  const orders = ordersData?.items || [];
  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((item: any) =>
        item.product.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesSearch;
  });

  const pages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "PENDING").length,
    processing: orders.filter(
      (o: any) => o.status === "CONFIRMED" || o.status === "PROCESSING",
    ).length,
    delivered: orders.filter((o: any) => o.status === "DELIVERED").length,
    completed: orders.filter((o: any) => o.status === "DELIVERED").length,
    totalSpent: orders.reduce(
      (sum: any, order: any) => sum + Number(order.total),
      0,
    ),
    totalRevenue: orders.reduce(
      (sum: any, order: any) => sum + Number(order.total),
      0,
    ),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium">My Orders</h1>
          <p className="text-sm text-default-500 mt-1">
            Track and manage your purchases
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-sm text-default-500">Total Orders</p>
          <p className="text-2xl font-medium mt-1">{stats.total}</p>
        </div>
        <div>
          <p className="text-sm text-default-500">Processing</p>
          <p className="text-2xl font-medium mt-1">{stats.processing}</p>
        </div>
        <div>
          <p className="text-sm text-default-500">Delivered</p>
          <p className="text-2xl font-medium mt-1">{stats.delivered}</p>
        </div>
        <div>
          <p className="text-sm text-default-500">Total Spent</p>
          <p className="text-2xl font-medium mt-1">
            ${stats.totalSpent.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search orders..."
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
            placeholder="Status"
            selectedKeys={[selectedStatus]}
            onSelectionChange={(keys) =>
              setSelectedStatus(Array.from(keys)[0] as string)
            }
            size="sm"
            className="max-w-[150px]"
            variant="bordered"
          >
            {orderStatuses.map((status) => (
              <SelectItem key={status.key}>{status.label}</SelectItem>
            ))}
          </Select>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardBody className="text-center py-10">
              <Icon
                icon="solar:bag-3-linear"
                className="w-16 h-16 mx-auto text-default-300 mb-4"
              />
              <p className="text-default-500">No orders found</p>
              <Button
                as={Link}
                href="/"
                color="primary"
                variant="flat"
                className="mt-4"
              >
                Start Shopping
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {paginatedOrders.map((order: any) => {
              const status =
                statusConfig[order.status as keyof typeof statusConfig];
              return (
                <Card key={order.id} className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div>
                      <p className="font-mono text-sm text-default-600">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-default-400 mt-1">
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2 sm:mt-0">
                      <Chip
                        variant="dot"
                        color={status.color as any}
                        size="sm"
                        classNames={{
                          base: "border-none",
                          content: "text-xs",
                        }}
                      >
                        {status.label}
                      </Chip>
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
                        <DropdownMenu aria-label="Order actions">
                          <DropdownItem key="view" onPress={() => router.push(`/dashboard/orders/${order.id}`)}>View Details</DropdownItem>
                          <DropdownItem key="track" onPress={() => router.push(`/dashboard/orders/${order.id}`)}>Track Order</DropdownItem>
                          <DropdownItem
                            key="return"
                            isDisabled={order.status !== "DELIVERED"}
                          >
                            Request Return
                          </DropdownItem>
                          <DropdownItem
                            key="cancel"
                            className="text-danger"
                            color="danger"
                            isDisabled={
                              order.status !== "PENDING" &&
                              order.status !== "CONFIRMED"
                            }
                            onPress={() =>
                              cancelOrderMutation.mutate({
                                orderId: order.id,
                                reason: "Customer requested cancellation",
                              })
                            }
                          >
                            Cancel Order
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 py-2"
                      >
                        <Image
                          src={item.product.images[0] || "/placeholder.png"}
                          alt={item.product.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {item.product.title}
                          </p>
                          {item.sizeDisplay && (
                            <p className="text-xs text-default-400">
                              Size: {item.sizeDisplay}
                            </p>
                          )}
                          {item.color && (
                            <p className="text-xs text-default-400">
                              Color: {item.color}
                            </p>
                          )}
                          <p className="text-xs text-default-400">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          ${Number(item.price).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-default-600">
                        {order.items.length} item
                        {order.items.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm font-medium">
                        Total: ${Number(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {pages > 1 && (
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
        )}
      </div>
    </div>
  );
}