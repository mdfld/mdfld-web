"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner, Tabs, Tab, Button, Chip, Avatar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import { trpc } from "@/lib/trpc-client";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, "warning" | "primary" | "secondary" | "success" | "danger" | "default"> = {
  PENDING: "warning",
  ACCEPTED: "primary",
  SHIPPING: "secondary",
  COMPLETED: "success",
  DECLINED: "danger",
  CANCELLED: "default",
  EXPIRED: "default",
};

function TradeRow({ offer, currentUserId }: { offer: any; currentUserId: string }) {
  const router = useRouter();
  const isProposer = offer.proposerId === currentUserId;
  const otherUser = isProposer ? offer.recipient : offer.proposer;

  return (
    <div className="flex items-center gap-3 p-4 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
      <Avatar src={otherUser?.image} name={otherUser?.name} size="sm" className="flex-shrink-0" />

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {offer.offeredProduct ? (
          <img
            src={offer.offeredProduct.images?.[0] || "/placeholder-product.jpg"}
            alt={offer.offeredProduct.title}
            className="w-10 h-10 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-default-100 flex items-center justify-center flex-shrink-0">
            <Icon icon="solar:dollar-minimalistic-linear" width={16} className="text-default-400" />
          </div>
        )}
        <Icon icon="solar:transfer-horizontal-linear" width={14} className="text-default-400 flex-shrink-0" />
        <img
          src={offer.requestedProduct.images?.[0] || "/placeholder-product.jpg"}
          alt={offer.requestedProduct.title}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-default-600 line-clamp-1">{otherUser?.name}</p>
          <p className="text-xs text-default-400">
            {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      <Chip size="sm" variant="flat" color={STATUS_COLOR[offer.status] ?? "default"} className="flex-shrink-0">
        {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
      </Chip>

      <Button
        size="sm"
        variant="flat"
        className="flex-shrink-0"
        onPress={() => router.push(`/dashboard/inbox?conversation=${offer.conversationId}`)}
      >
        View
      </Button>
    </div>
  );
}

export default function TradesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { data: offers = [], isLoading } = trpc.trade.getMyOffers.useQuery();

  useEffect(() => {
    if (!isPending && !session) router.push("/auth/login");
  }, [session, isPending, router]);

  if (isPending || typeof window === "undefined") {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentUserId = session?.user?.id || "";
  const received = (offers as any[]).filter((o: any) => o.recipientId === currentUserId);
  const sent = (offers as any[]).filter((o: any) => o.proposerId === currentUserId);

  return (
    <SidebarWrapper>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Trades</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Tabs aria-label="Trade tabs" fullWidth>
            <Tab key="received" title={`Received (${received.length})`}>
              {received.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="solar:transfer-horizontal-linear" width={48} className="mx-auto mb-3 text-default-300" />
                  <p className="text-default-500 mb-4">No trade offers received yet</p>
                  <Button variant="flat" onPress={() => router.push("/shop")}>
                    Browse Listings
                  </Button>
                </div>
              ) : (
                received.map((o: any) => (
                  <TradeRow key={o.id} offer={o} currentUserId={currentUserId} />
                ))
              )}
            </Tab>
            <Tab key="sent" title={`Sent (${sent.length})`}>
              {sent.length === 0 ? (
                <div className="text-center py-12">
                  <Icon icon="solar:transfer-horizontal-linear" width={48} className="mx-auto mb-3 text-default-300" />
                  <p className="text-default-500 mb-4">You haven't sent any trade offers yet</p>
                  <Button variant="flat" onPress={() => router.push("/shop")}>
                    Browse Listings
                  </Button>
                </div>
              ) : (
                sent.map((o: any) => (
                  <TradeRow key={o.id} offer={o} currentUserId={currentUserId} />
                ))
              )}
            </Tab>
          </Tabs>
        )}
      </div>
    </SidebarWrapper>
  );
}
