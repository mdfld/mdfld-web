"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner, Card, CardBody, Chip, Button, Image } from "@heroui/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { format } from "date-fns";
import SidebarWrapper from "@/components/sidebar/dashboard/app";

export const dynamic = "force-dynamic";

const statusConfig: Record<string, { color: any; label: string; icon: string }> = {
  PENDING:    { color: "warning",   label: "Pending",    icon: "solar:clock-circle-bold" },
  CONFIRMED:  { color: "primary",   label: "Confirmed",  icon: "solar:check-circle-bold" },
  PROCESSING: { color: "primary",   label: "Processing", icon: "solar:settings-bold" },
  SHIPPED:    { color: "secondary", label: "Shipped",    icon: "solar:delivery-bold" },
  DELIVERED:  { color: "success",   label: "Delivered",  icon: "solar:box-bold" },
  CANCELLED:  { color: "danger",    label: "Cancelled",  icon: "solar:close-circle-bold" },
  REFUNDED:   { color: "default",   label: "Refunded",   icon: "solar:card-recive-bold" },
};

const STEPS = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function OrderDetailContent({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { data: ordersData, isLoading } = (trpc as any).order.getMyOrders.useQuery({
    limit: 100,
    status: "all",
  });

  const order = ordersData?.items?.find((o: any) => o.id === orderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <Icon icon="solar:bag-3-linear" className="w-16 h-16 text-default-300" />
        <p className="text-default-500">Order not found</p>
        <Button variant="flat" onPress={() => router.push("/dashboard/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const status = statusConfig[order.status] ?? statusConfig.PENDING;
  const stepIndex = STEPS.indexOf(order.status);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => router.push("/dashboard/orders")}
        >
          <Icon icon="solar:arrow-left-linear" className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-medium">Order {order.orderNumber}</h1>
          <p className="text-sm text-default-500">
            Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
          </p>
        </div>
        <Chip
          variant="dot"
          color={status.color}
          size="sm"
          classNames={{ base: "border-none ml-auto", content: "text-xs" }}
        >
          {status.label}
        </Chip>
      </div>

      {/* Progress tracker */}
      {!["CANCELLED", "REFUNDED"].includes(order.status) && (
        <Card>
          <CardBody className="py-6">
            <div className="flex items-center justify-between relative">
              <div
                className="absolute top-5 left-0 right-0 h-0.5 bg-default-200"
                style={{ zIndex: 0 }}
              />
              <div
                className="absolute top-5 left-0 h-0.5 bg-primary transition-all"
                style={{
                  width: stepIndex >= 0 ? `${(stepIndex / (STEPS.length - 1)) * 100}%` : "0%",
                  zIndex: 1,
                }}
              />
              {STEPS.map((step, i) => {
                const done = stepIndex >= i;
                const cfg = statusConfig[step];
                return (
                  <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        done ? "bg-primary text-white" : "bg-default-100 text-default-400"
                      }`}
                    >
                      <Icon icon={cfg.icon} className="w-5 h-5" />
                    </div>
                    <p className={`text-xs ${done ? "text-primary font-medium" : "text-default-400"}`}>
                      {cfg.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardBody>
          <p className="text-sm font-medium mb-4">
            {order.items.length} Item{order.items.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4">
                <Image
                  src={item.product.images?.[0] || "/placeholder.jpg"}
                  alt={item.product.title}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.title}</p>
                  {item.sizeDisplay && (
                    <p className="text-xs text-default-400">Size: {item.sizeDisplay}</p>
                  )}
                  {item.color && (
                    <p className="text-xs text-default-400">Color: {item.color}</p>
                  )}
                  <p className="text-xs text-default-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium flex-shrink-0">
                  ${Number(item.price).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Shipping</span>
              <span>${Number(order.shipping).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-default-500">Tax</span>
              <span>${Number(order.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium pt-1 border-t">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Shipping address */}
      {order.shippingAddress && (
        <Card>
          <CardBody>
            <p className="text-sm font-medium mb-3">Shipping Address</p>
            <div className="text-sm text-default-600 space-y-0.5">
              {order.shippingAddress.name && <p className="font-medium">{order.shippingAddress.name}</p>}
              {order.shippingAddress.line1 && <p>{order.shippingAddress.line1}</p>}
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode]
                  .filter(Boolean).join(", ")}
              </p>
              {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payment info */}
      <Card>
        <CardBody>
          <p className="text-sm font-medium mb-3">Payment</p>
          <div className="flex justify-between text-sm">
            <span className="text-default-500">Method</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-default-500">Status</span>
            <span className="capitalize">{order.paymentStatus?.toLowerCase()}</span>
          </div>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="flat"
          onPress={() => router.push("/dashboard/orders")}
          startContent={<Icon icon="solar:arrow-left-linear" />}
        >
          Back to Orders
        </Button>
        {["PENDING", "CONFIRMED"].includes(order.status) && (
          <Button
            variant="flat"
            color="danger"
            onPress={() => router.push("/contact")}
          >
            Cancel Order
          </Button>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/login");
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <SidebarWrapper>
        <div className="flex-1 p-6 overflow-y-auto">
          <OrderDetailContent orderId={orderId} />
        </div>
      </SidebarWrapper>
    </div>
  );
}