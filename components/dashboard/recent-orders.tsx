"use client";

import { Card, CardHeader, CardFooter, Button, Chip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

const STATUS_COLOR: Record<string, string> = {
  DELIVERED: "bg-success/80",
  SHIPPED: "bg-warning/80",
  PROCESSING: "bg-primary/80",
  CONFIRMED: "bg-primary/80",
  PENDING: "bg-default/80",
  CANCELLED: "bg-danger/80",
  REFUNDED: "bg-danger/80",
};

const STATUS_CHIP_COLOR: Record<string, "success" | "warning" | "primary" | "danger" | "default"> = {
  DELIVERED: "success",
  SHIPPED: "warning",
  PROCESSING: "primary",
  CONFIRMED: "primary",
  PENDING: "default",
  CANCELLED: "danger",
  REFUNDED: "danger",
};

export const RecentOrders = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const { data, isLoading } = trpc.order.getMyOrders.useQuery({ limit: 20, status: "all" });
  const allOrders = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <p className="text-small text-default-500">Loading…</p>
        </div>
        <Card className="w-full h-[320px] flex items-center justify-center">
          <Spinner size="lg" />
        </Card>
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <p className="text-small text-default-500">No orders yet</p>
        </div>
        <Card className="w-full h-[320px] bg-default-100 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="solar:bag-4-linear" className="w-16 h-16 mx-auto text-default-400 mb-4" />
            <p className="text-default-500">No orders yet</p>
            <Button color="primary" variant="flat" className="mt-4" onPress={() => router.push("/shop")}>
              Start Shopping
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const order = allOrders[currentIndex];
  const firstItem = order?.items?.[0];
  const img = firstItem?.product?.images?.[0];
  const title = firstItem?.product?.title ?? "Your Order";
  const extraCount = (order?.items?.length ?? 1) - 1;
  const total = `$${Number(order?.total ?? 0).toFixed(2)}`;
  const status = order?.status ?? "PENDING";
  const orderId = order?.id?.slice(-6).toUpperCase();
  const date = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <p className="text-small text-default-500">{allOrders.length} total orders</p>
        </div>
        <div className="flex gap-1">
          {allOrders.length > 1 && (
            <>
              <Button isIconOnly size="sm" variant="light"
                onPress={() => setCurrentIndex((i) => (i - 1 + allOrders.length) % allOrders.length)}
                aria-label="Previous">
                <Icon icon="solar:arrow-left-linear" width={16} />
              </Button>
              <Button isIconOnly size="sm" variant="light"
                onPress={() => setCurrentIndex((i) => (i + 1) % allOrders.length)}
                aria-label="Next">
                <Icon icon="solar:arrow-right-linear" width={16} />
              </Button>
            </>
          )}
        </div>
      </div>

      <Card isFooterBlurred className="w-full h-[320px]">
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <p className="text-tiny text-white/80 uppercase font-bold drop-shadow-md tracking-widest">
            #{orderId} · {date}
          </p>
          <h4 className="text-white font-medium text-large drop-shadow-md line-clamp-1">
            {title}{extraCount > 0 ? ` +${extraCount} more` : ""}
          </h4>
        </CardHeader>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/60 z-[5] pointer-events-none" />

        {img ? (
          <img
            src={img}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-default-200 to-default-300 flex items-center justify-center">
            <Icon icon="solar:bag-4-linear" className="w-24 h-24 text-default-400 opacity-40" />
          </div>
        )}

        {/* Status badge center */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <span className={`text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full ${STATUS_COLOR[status] ?? "bg-default/80"}`}>
            {status.toLowerCase()}
          </span>
        </div>

        <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600">
          <div className="flex grow gap-2 items-center">
            <div className="flex flex-col">
              <p className="text-tiny text-white/60">{currentIndex + 1} of {allOrders.length}</p>
              <p className="text-white font-bold">{total}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              radius="md" size="sm" variant="bordered"
              className="text-white border-white/30"
              startContent={<Icon icon="solar:routing-2-linear" width={16} />}
              onPress={() => router.push(`/dashboard/orders/${order.id}?tab=tracking`)}
            >
              Track
            </Button>
            <Button
              radius="md" size="sm" color="primary"
              startContent={<Icon icon="solar:eye-linear" width={16} />}
              onPress={() => router.push(`/dashboard/orders/${order.id}`)}
            >
              View
            </Button>
          </div>
        </CardFooter>
      </Card>

      {allOrders.length > 1 && (
        <div className="flex justify-center gap-1">
          {allOrders.slice(0, 8).map((_: any, i: number) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-primary" : "bg-default-200"}`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
          {allOrders.length > 8 && (
            <button
              className="text-tiny text-default-400 ml-1"
              onClick={() => router.push("/dashboard/orders")}
            >
              +{allOrders.length - 8}
            </button>
          )}
        </div>
      )}
    </div>
  );
};