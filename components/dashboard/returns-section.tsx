"use client";

import { Card, CardHeader, CardFooter, Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

export const ReturnsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const { data, isLoading } = trpc.order.getMyOrders.useQuery({ limit: 20, status: "all" });

  const eligibleOrders = (data?.items ?? []).filter((o: any) => {
    if (o.status !== "DELIVERED") return false;
    const daysSince = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 86400000);
    return daysSince <= 30;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold">Returns</h3>
          <p className="text-small text-default-500">Loading…</p>
        </div>
        <Card className="w-full h-[320px] flex items-center justify-center">
          <Spinner size="lg" />
        </Card>
      </div>
    );
  }

  if (eligibleOrders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="px-2">
          <h3 className="text-lg font-semibold">Returns</h3>
          <p className="text-small text-default-500">No eligible returns</p>
        </div>
        <Card className="w-full h-[320px] bg-default-100 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="solar:box-minimalistic-linear" className="w-16 h-16 mx-auto text-default-400 mb-4" />
            <p className="text-default-500">No delivered orders eligible for return</p>
            <p className="text-tiny text-default-400 mt-2">Returns accepted within 30 days of delivery</p>
          </div>
        </Card>
      </div>
    );
  }

  const order = eligibleOrders[currentIndex];
  const firstItem = order?.items?.[0];
  const img = firstItem?.product?.images?.[0];
  const title = firstItem?.product?.title ?? "Your Order";
  const extraCount = (order?.items?.length ?? 1) - 1;
  const total = `$${Number(order?.total ?? 0).toFixed(2)}`;
  const orderId = order?.id?.slice(-6).toUpperCase();
  const deliveredDate = order?.updatedAt
    ? new Date(order.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";
  const daysSince = Math.floor((Date.now() - new Date(order?.createdAt ?? 0).getTime()) / 86400000);
  const daysLeft = 30 - daysSince;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="text-lg font-semibold">Returns</h3>
          <p className="text-small text-default-500">
            {eligibleOrders.length} eligible order{eligibleOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
        {eligibleOrders.length > 1 && (
          <div className="flex gap-1">
            <Button isIconOnly size="sm" variant="light"
              onPress={() => setCurrentIndex((i) => (i - 1 + eligibleOrders.length) % eligibleOrders.length)}
              aria-label="Previous">
              <Icon icon="solar:arrow-left-linear" width={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light"
              onPress={() => setCurrentIndex((i) => (i + 1) % eligibleOrders.length)}
              aria-label="Next">
              <Icon icon="solar:arrow-right-linear" width={16} />
            </Button>
          </div>
        )}
      </div>

      <Card isFooterBlurred className="w-full h-[320px]">
        <CardHeader className="absolute z-10 top-1 flex-col items-start">
          <p className="text-tiny text-white/80 uppercase font-bold drop-shadow-md tracking-widest">
            #{orderId} · Delivered {deliveredDate}
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
            <Icon icon="solar:box-minimalistic-linear" className="w-24 h-24 text-default-400 opacity-40" />
          </div>
        )}

        {/* Days left badge */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className={`text-4xl font-black ${daysLeft <= 5 ? "text-danger" : "text-white"} drop-shadow-lg`}>
              {daysLeft}
            </p>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold drop-shadow">
              days left to return
            </p>
          </div>
        </div>

        <CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600">
          <div className="flex grow gap-2 items-center">
            <div className="flex flex-col">
              <p className="text-tiny text-white/60">Order value</p>
              <p className="text-white font-bold">{total}</p>
            </div>
          </div>
          <Button
            radius="md" size="sm" color="primary"
            startContent={<Icon icon="solar:arrow-left-down-linear" width={16} />}
            onPress={() => router.push(`/dashboard/orders/${order.id}`)}
          >
            Start Return
          </Button>
        </CardFooter>
      </Card>

      {eligibleOrders.length > 1 && (
        <div className="flex justify-center gap-1">
          {eligibleOrders.map((_: any, i: number) => (
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