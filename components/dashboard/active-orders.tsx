"use client";

import { Card, CardHeader, CardFooter, Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Preparing",
  SHIPPED: "On the Way",
};
const STATUS_PROGRESS: Record<string, number> = {
  PENDING: 18,
  CONFIRMED: 40,
  PROCESSING: 65,
  SHIPPED: 88,
};

export const ActiveOrders = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const { data, isLoading } = trpc.order.getMyOrders.useQuery({ limit: 20, status: "all" });

  const activeOrders = (data?.items ?? []).filter((o: any) =>
    STATUS_STEPS.includes(o.status)
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold">Active Orders</h3>
          <p className="text-small text-default-500">Loading…</p>
        </div>
        <Card className="w-full h-[320px] flex items-center justify-center">
          <Spinner size="lg" />
        </Card>
      </div>
    );
  }

  if (activeOrders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold">Active Orders</h3>
          <p className="text-small text-default-500">No active orders</p>
        </div>
        <Card className="w-full h-[320px] bg-default-100 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="solar:box-minimalistic-linear" className="w-16 h-16 mx-auto text-default-400 mb-4" />
            <p className="text-default-500">No active orders right now</p>
            <Button color="primary" variant="flat" className="mt-4" onPress={() => router.push("/shop")}>
              Shop Now
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const order = activeOrders[currentIndex];
  const firstItem = order?.items?.[0];
  const img = firstItem?.product?.images?.[0];
  const title = firstItem?.product?.title ?? "Your Order";
  const extraCount = (order?.items?.length ?? 1) - 1;
  const total = `$${Number(order?.total ?? 0).toFixed(2)}`;
  const status = order?.status ?? "PENDING";
  const progress = STATUS_PROGRESS[status] ?? 20;
  const orderId = order?.id?.slice(-6).toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="text-lg font-semibold">Active Orders</h3>
          <p className="text-small text-default-500">
            {activeOrders.length} in progress
          </p>
        </div>
        {activeOrders.length > 1 && (
          <div className="flex gap-1">
            <Button isIconOnly size="sm" variant="light"
              onPress={() => setCurrentIndex((i) => (i - 1 + activeOrders.length) % activeOrders.length)}
              aria-label="Previous">
              <Icon icon="solar:arrow-left-linear" width={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light"
              onPress={() => setCurrentIndex((i) => (i + 1) % activeOrders.length)}
              aria-label="Next">
              <Icon icon="solar:arrow-right-linear" width={16} />
            </Button>
          </div>
        )}
      </div>

      <Card isFooterBlurred className="w-full h-[320px]">
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <p className="text-tiny text-white/80 uppercase font-bold drop-shadow-md tracking-widest">
            #{orderId} · {STATUS_LABEL[status] ?? status}
          </p>
          <h4 className="text-white font-medium text-large drop-shadow-md line-clamp-1">
            {title}{extraCount > 0 ? ` +${extraCount} more` : ""}
          </h4>
        </CardHeader>

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/60 z-[5] pointer-events-none" />

        {/* Background image or gradient placeholder */}
        {img ? (
          <img
            src={img}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-default-200 to-default-300 flex items-center justify-center">
            <Icon icon="solar:box-minimalistic-linear" className="w-24 h-24 text-default-400 opacity-40" />
          </div>
        )}

        {/* Progress bar in middle */}
        <div className="absolute bottom-20 left-0 right-0 z-10 px-4">
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            {["Placed", "Confirmed", "Shipped", "Delivered"].map((s) => (
              <span key={s} className="text-tiny text-white/40">{s}</span>
            ))}
          </div>
        </div>

        <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600">
          <div className="flex grow gap-2 items-center">
            <div className="flex flex-col">
              <p className="text-tiny text-white/60">Total</p>
              <p className="text-white font-bold">{total}</p>
            </div>
          </div>
          <Button
            radius="md" size="sm" color="primary"
            startContent={<Icon icon="solar:eye-linear" width={16} />}
            onPress={() => router.push(`/dashboard/orders/${order.id}`)}
          >
            Track Order
          </Button>
        </CardFooter>
      </Card>

      {activeOrders.length > 1 && (
        <div className="flex justify-center gap-1">
          {activeOrders.map((_: any, i: number) => (
            <button
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-primary" : "bg-default-200"}`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};