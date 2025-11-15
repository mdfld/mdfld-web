"use client";

import React, { useState } from "react";
import {
  Button,
  Chip,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Pagination,
  Spinner,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { format } from "date-fns";
import { toast } from "sonner";

const returnStatuses = [
  { key: "all", label: "All Returns" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "completed", label: "Completed" },
];

const returnReasons = [
  { key: "defective", label: "Defective/Damaged" },
  { key: "wrong_item", label: "Wrong Item Received" },
  { key: "not_as_described", label: "Not as Described" },
  { key: "changed_mind", label: "Changed Mind" },
  { key: "size_issue", label: "Size/Fit Issue" },
  { key: "other", label: "Other" },
];

export default function ReturnsLayout() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDetails, setReturnDetails] = useState("");
  const rowsPerPage = 10;

  const {
    data: ordersData,
    isLoading,
    refetch,
  } = trpc.order.getMyOrders.useQuery({
    limit: 50,
    status: "delivered",
  }) as any;

  // Mock return mutation - replace with actual API call when implemented
  const requestReturnMutation = {
    mutate: (_data: any) => {
      // Simulate API call
      setTimeout(() => {
        toast.success("Return request submitted");
        setIsReturnModalOpen(false);
        setSelectedOrder(null);
        setReturnReason("");
        setReturnDetails("");
        refetch();
      }, 1000);
    },
    isPending: false,
  };

  const orders = ordersData?.items || [];
  const deliveredOrders = orders.filter(
    (order: any) => order.status === "DELIVERED",
  );

  // Mock returns data - in production, this would come from the API
  const mockReturns = [
    {
      id: "1",
      orderNumber: "ORD-12345",
      items: [{ title: "Nike Air Max 90", quantity: 1, price: 129.99 }],
      status: "pending",
      reason: "defective",
      createdAt: new Date("2024-01-10"),
      total: 129.99,
    },
    {
      id: "2",
      orderNumber: "ORD-12346",
      items: [{ title: "Adidas Ultraboost", quantity: 1, price: 180.0 }],
      status: "approved",
      reason: "wrong_item",
      createdAt: new Date("2024-01-08"),
      total: 180.0,
    },
  ];

  const filteredReturns = mockReturns.filter((ret) => {
    const matchesSearch =
      ret.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.items.some((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesStatus =
      selectedStatus === "all" || ret.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const pages = Math.ceil(filteredReturns.length / rowsPerPage);
  const paginatedReturns = filteredReturns.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const handleReturnRequest = (order: any) => {
    setSelectedOrder(order);
    setIsReturnModalOpen(true);
  };

  const submitReturnRequest = () => {
    if (!selectedOrder || !returnReason || !returnDetails) {
      toast.error("Please fill in all required fields");
      return;
    }

    requestReturnMutation.mutate({
      orderId: selectedOrder.id,
      reason: returnReason,
      details: returnDetails,
    });
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
          <h1 className="text-2xl font-medium">Returns & Refunds</h1>
          <p className="text-sm text-default-500 mt-1">
            Manage your return requests
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <p className="text-sm text-default-500">Total Returns</p>
          <p className="text-2xl font-medium mt-1">{mockReturns.length}</p>
        </div>
        <div>
          <p className="text-sm text-default-500">Pending</p>
          <p className="text-2xl font-medium mt-1">
            {mockReturns.filter((r) => r.status === "pending").length}
          </p>
        </div>
        <div>
          <p className="text-sm text-default-500">Approved</p>
          <p className="text-2xl font-medium mt-1">
            {mockReturns.filter((r) => r.status === "approved").length}
          </p>
        </div>
        <div>
          <p className="text-sm text-default-500">Eligible Orders</p>
          <p className="text-2xl font-medium mt-1">{deliveredOrders.length}</p>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Return Requests</h3>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Input
                placeholder="Search returns..."
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
                {returnStatuses.map((status) => (
                  <SelectItem key={status.key}>{status.label}</SelectItem>
                ))}
              </Select>
            </div>

            {filteredReturns.length === 0 ? (
              <div className="text-center py-10">
                <Icon
                  icon="solar:rewind-back-linear"
                  className="w-16 h-16 mx-auto text-default-300 mb-4"
                />
                <p className="text-default-500">No return requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedReturns.map((ret) => (
                  <Card key={ret.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-mono text-sm text-default-600">
                          {ret.orderNumber}
                        </p>
                        <p className="text-xs text-default-400 mt-1">
                          Requested on {format(ret.createdAt, "MMM dd, yyyy")}
                        </p>
                        <div className="mt-3">
                          {ret.items.map((item, idx) => (
                            <p key={idx} className="text-sm">
                              {item.title} x{item.quantity}
                            </p>
                          ))}
                        </div>
                        <p className="text-sm text-default-500 mt-2">
                          Reason:{" "}
                          {
                            returnReasons.find((r) => r.key === ret.reason)
                              ?.label
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <Chip
                          variant="dot"
                          color={
                            ret.status === "pending"
                              ? "warning"
                              : ret.status === "approved"
                                ? "success"
                                : ret.status === "rejected"
                                  ? "danger"
                                  : "default"
                          }
                          size="sm"
                          className="mb-2"
                        >
                          {ret.status.charAt(0).toUpperCase() +
                            ret.status.slice(1)}
                        </Chip>
                        <p className="text-sm font-medium">
                          ${ret.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
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

          <div>
            <h3 className="text-lg font-medium mb-4">Eligible for Return</h3>
            <p className="text-sm text-default-500 mb-4">
              Orders delivered within the last 30 days
            </p>
            {deliveredOrders.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-default-500">
                  No eligible orders for return
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliveredOrders.map((order: any) => (
                  <Card key={order.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-mono text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-default-400 mt-1">
                          Delivered on{" "}
                          {format(new Date(order.updatedAt), "MMM dd, yyyy")}
                        </p>
                        <p className="text-sm mt-2">
                          {order.items.length} item
                          {order.items.length > 1 ? "s" : ""} • $
                          {Number(order.total).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleReturnRequest(order)}
                      >
                        Request Return
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal
        isOpen={isReturnModalOpen}
        onOpenChange={setIsReturnModalOpen}
        size="2xl"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Request Return</ModalHeader>
              <ModalBody>
                {selectedOrder && (
                  <div className="space-y-4">
                    <Card>
                      <CardBody>
                        <p className="text-sm font-medium mb-2">
                          Order #{selectedOrder.orderNumber}
                        </p>
                        <div className="space-y-2">
                          {selectedOrder.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3"
                            >
                              <Image
                                src={
                                  item.product.images[0] || "/placeholder.png"
                                }
                                alt={item.product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="text-sm">{item.product.title}</p>
                                <p className="text-xs text-default-400">
                                  Qty: {item.quantity} • $
                                  {Number(item.price).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>

                    <Select
                      label="Reason for Return"
                      placeholder="Select a reason"
                      selectedKeys={returnReason ? [returnReason] : []}
                      onSelectionChange={(keys) =>
                        setReturnReason(Array.from(keys)[0] as string)
                      }
                      isRequired
                    >
                      {returnReasons.map((reason) => (
                        <SelectItem key={reason.key}>{reason.label}</SelectItem>
                      ))}
                    </Select>

                    <Textarea
                      label="Additional Details"
                      placeholder="Please provide more information about your return request..."
                      value={returnDetails}
                      onValueChange={setReturnDetails}
                      minRows={3}
                      isRequired
                    />

                    <Card className="bg-default-50">
                      <CardBody className="text-sm">
                        <p className="font-medium mb-2">Return Policy</p>
                        <ul className="list-disc list-inside space-y-1 text-default-600">
                          <li>Items must be returned within 30 days</li>
                          <li>Items must be in original condition</li>
                          <li>Original packaging and tags required</li>
                          <li>Refund will be processed after inspection</li>
                        </ul>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={submitReturnRequest}
                  isLoading={requestReturnMutation.isPending}
                >
                  Submit Return Request
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
