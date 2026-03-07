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
  User,
  Pagination,
  Spinner,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Image,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { useOrganizationStore } from "@/lib/stores/organization";
import { format } from "date-fns";
import { toast } from "sonner";

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

export default function OrganizationOrdersLayout() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const rowsPerPage = 10;

  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = trpc.organization.getOrders.useQuery(
    {
      organizationId: activeOrganization?.id || "",
      limit: 50,
      status:
        selectedStatus === "all"
          ? undefined
          : (selectedStatus.toUpperCase() as any),
    },
    {
      enabled: !!activeOrganization?.id,
    },
  );

  const updateOrderStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Order status updated");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update order status");
    },
  });

  const orders = ordersData?.items || [];
  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer.user?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      order.buyer.user?.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

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
      (o: any) => o.status === "PROCESSING" || o.status === "CONFIRMED",
    ).length,
    delivered: orders.filter((o: any) => o.status === "DELIVERED").length,
    revenue: orders.reduce(
      (sum: any, order: any) => sum + Number(order.total),
      0,
    ),
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({
      orderId,
      status: newStatus as any,
      trackingNumber:
        newStatus === "SHIPPED" ? "TRACK-" + Date.now() : undefined,
    });
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
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
          <h1 className="text-2xl font-medium">Orders</h1>
          <p className="text-sm text-default-500 mt-1">
            Manage your store orders
          </p>
        </div>
        <Button
          variant="flat"
          size="sm"
          startContent={<Icon icon="solar:export-linear" className="w-4 h-4" />}
        >
          Export
        </Button>
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
          <p className="text-sm text-default-500">Revenue</p>
          <p className="text-2xl font-medium mt-1">
            ${stats.revenue.toFixed(2)}
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
              <p className="text-default-500">No orders yet</p>
              <p className="text-sm text-default-400 mt-1">
                Orders will appear here when customers make purchases
              </p>
            </CardBody>
          </Card>
        ) : (
          <Table
            aria-label="Orders table"
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
              <TableColumn>ORDER</TableColumn>
              <TableColumn>CUSTOMER</TableColumn>
              <TableColumn>DATE</TableColumn>
              <TableColumn>TOTAL</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn> </TableColumn>
            </TableHeader>
            <TableBody emptyContent="No orders found">
              {paginatedOrders.map((order: any) => {
                const status =
                  statusConfig[order.status as keyof typeof statusConfig];
                return (
                  <TableRow
                    key={order.id}
                    className="hover:bg-default-50 transition-colors cursor-pointer"
                    onClick={() => viewOrderDetails(order)}
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm font-mono">{order.orderNumber}</p>
                        <p className="text-xs text-default-400">
                          {order.items.length} items
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <User
                        avatarProps={{
                          radius: "full",
                          size: "sm",
                          src:
                            order.buyer.user?.image ||
                            `https://i.pravatar.cc/150?u=${order.buyer.user?.id}`,
                          className: "w-8 h-8",
                        }}
                        description={order.buyer.user?.email}
                        name={order.buyer.user?.name}
                        classNames={{
                          name: "text-sm",
                          description: "text-xs",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600">
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">
                        ${Number(order.total).toFixed(2)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Chip
                        variant="dot"
                        color={status.color as any}
                        size="sm"
                        classNames={{
                          base: "border-none",
                          content: "text-xs capitalize",
                        }}
                      >
                        {status.label}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="w-8 h-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon
                              icon="solar:menu-dots-bold"
                              className="w-4 h-4"
                            />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Order actions">
                          <DropdownItem
                            key="view"
                            onPress={() => viewOrderDetails(order)}
                          >
                            View Details
                          </DropdownItem>
                          <DropdownItem
                            key="confirm"
                            isDisabled={order.status !== "PENDING"}
                            onPress={() =>
                              handleStatusUpdate(order.id, "CONFIRMED")
                            }
                          >
                            Mark as Confirmed
                          </DropdownItem>
                          <DropdownItem
                            key="process"
                            isDisabled={order.status !== "CONFIRMED"}
                            onPress={() =>
                              handleStatusUpdate(order.id, "PROCESSING")
                            }
                          >
                            Mark as Processing
                          </DropdownItem>
                          <DropdownItem
                            key="ship"
                            isDisabled={order.status !== "PROCESSING"}
                            onPress={() =>
                              handleStatusUpdate(order.id, "SHIPPED")
                            }
                          >
                            Mark as Shipped
                          </DropdownItem>
                          <DropdownItem
                            key="deliver"
                            isDisabled={order.status !== "SHIPPED"}
                            onPress={() =>
                              handleStatusUpdate(order.id, "DELIVERED")
                            }
                          >
                            Mark as Delivered
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
                              handleStatusUpdate(order.id, "CANCELLED")
                            }
                          >
                            Cancel Order
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <Modal
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div>
                  <p className="text-lg font-medium">Order Details</p>
                  <p className="text-sm text-default-500">
                    {selectedOrder?.orderNumber}
                  </p>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedOrder && (
                  <div className="space-y-4">
                    <Card>
                      <CardBody>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-default-500">
                              Order Date
                            </p>
                            <p className="text-sm font-medium">
                              {format(
                                new Date(selectedOrder.createdAt),
                                "MMM dd, yyyy 'at' h:mm a",
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-default-500">Status</p>
                            <Chip
                              variant="dot"
                              color={
                                statusConfig[
                                  selectedOrder.status as keyof typeof statusConfig
                                ].color as any
                              }
                              size="sm"
                            >
                              {
                                statusConfig[
                                  selectedOrder.status as keyof typeof statusConfig
                                ].label
                              }
                            </Chip>
                          </div>
                          <div>
                            <p className="text-sm text-default-500">Customer</p>
                            <p className="text-sm font-medium">
                              {selectedOrder.buyer.user?.name}
                            </p>
                            <p className="text-xs text-default-400">
                              {selectedOrder.buyer.user?.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-default-500">
                              Payment Method
                            </p>
                            <p className="text-sm font-medium">
                              {selectedOrder.paymentMethod}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <p className="text-sm font-medium mb-4">Order Items</p>
                        <div className="space-y-3">
                          {selectedOrder.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4"
                            >
                              <Image
                                src={
                                  item.product.images[0] || "/placeholder.png"
                                }
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
                        <div className="border-t pt-3 mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-default-500">Subtotal</span>
                            <span>
                              ${Number(selectedOrder.subtotal).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-default-500">Tax</span>
                            <span>${Number(selectedOrder.tax).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-default-500">Shipping</span>
                            <span>
                              ${Number(selectedOrder.shipping).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>
                              ${Number(selectedOrder.total).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardBody>
                        <p className="text-sm font-medium mb-4">
                          Shipping Address
                        </p>
                        <div className="text-sm">
                          <p>{selectedOrder.shippingAddress.name}</p>
                          <p className="text-default-500">
                            {selectedOrder.shippingAddress.street}
                          </p>
                          <p className="text-default-500">
                            {selectedOrder.shippingAddress.city},{" "}
                            {selectedOrder.shippingAddress.state}{" "}
                            {selectedOrder.shippingAddress.postalCode}
                          </p>
                          <p className="text-default-500">
                            {selectedOrder.shippingAddress.country}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}