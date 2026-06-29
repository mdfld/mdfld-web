"use client";

import React, { useState } from "react";
import { Button, Chip, Image, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import { resolveTradeOfferActions } from "@/lib/trade-action";
import type { TradeViewerRole } from "@/lib/trade-action";
import CounterOfferModal from "@/components/product/counter-offer-modal";

interface TradeProduct {
  id: string;
  title: string;
  price: number | string;
  images: string[];
}

interface TradeOfferData {
  id: string;
  proposerId: string;
  recipientId: string;
  status: string;
  cashAmount: number | string | null;
  offeredProductId: string | null;
  requestedProductId: string;
  conversationId: string;
  counterCashAmount: number | string | null;
  proposerTrackingNumber: string | null;
  recipientTrackingNumber: string | null;
  requestedProduct: TradeProduct;
  offeredProduct: TradeProduct | null;
  proposer: { id: string; name: string };
  recipient: { id: string; name: string };
}

interface TradeOfferCardProps {
  offer: TradeOfferData;
  currentUserId: string;
  onUpdate?: () => void;
}

const STATUS_CHIP: Record<
  string,
  {
    color: "warning" | "primary" | "secondary" | "success" | "danger" | "default";
    label: string;
  }
> = {
  PENDING: { color: "warning", label: "Pending" },
  COUNTERED: { color: "secondary", label: "Countered" },
  ACCEPTED: { color: "primary", label: "Accepted" },
  SHIPPING: { color: "secondary", label: "Shipping" },
  COMPLETED: { color: "success", label: "Complete" },
  DECLINED: { color: "danger", label: "Declined" },
  CANCELLED: { color: "default", label: "Cancelled" },
  EXPIRED: { color: "default", label: "Expired" },
  DISPUTED: { color: "danger", label: "Disputed" },
  AWAITING_PAYMENT: { color: "warning", label: "Payment Pending" },
};

export default function TradeOfferCard({ offer, currentUserId, onUpdate }: TradeOfferCardProps) {
  const [trackingInput, setTrackingInput] = useState("");
  const [showTrackingInput, setShowTrackingInput] = useState(false);
  const [counterModalOpen, setCounterModalOpen] = useState(false);

  const viewerRole: TradeViewerRole =
    offer.proposerId === currentUserId ? "proposer" : "recipient";

  const viewerHasUploaded =
    viewerRole === "proposer"
      ? !!offer.proposerTrackingNumber
      : !!offer.recipientTrackingNumber;

  const actions = resolveTradeOfferActions(viewerRole, offer.status, viewerHasUploaded);

  const respondMutation = trpc.trade.respondToOffer.useMutation({
    onSuccess: () => {
      toast.success("Response sent");
      onUpdate?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelMutation = trpc.trade.cancelOffer.useMutation({
    onSuccess: () => {
      toast.success("Offer cancelled");
      onUpdate?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const trackingMutation = trpc.trade.uploadTracking.useMutation({
    onSuccess: () => {
      toast.success("Tracking uploaded!");
      setShowTrackingInput(false);
      onUpdate?.();
    },
    onError: (e) => toast.error(e.message),
  });

  const paymentLinkMutation = trpc.trade.getPaymentLink.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (e) => toast.error(e.message),
  });

  const chip = STATUS_CHIP[offer.status] ?? { color: "default" as const, label: offer.status };
  const cash = offer.cashAmount ? Number(offer.cashAmount) : 0;

  return (
    <div className="border-b border-zinc-800 px-4 py-3 bg-zinc-950">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-default-500 uppercase tracking-wide">
          Trade Offer
        </span>
        <Chip color={chip.color} size="sm" variant="flat">
          {chip.label}
        </Chip>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {offer.offeredProduct ? (
          <div className="flex flex-col items-center gap-1 flex-1 text-center min-w-0">
            <Image
              src={offer.offeredProduct.images?.[0] || "/placeholder-product.jpg"}
              alt={offer.offeredProduct.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <p className="text-xs text-default-600 line-clamp-1">{offer.offeredProduct.title}</p>
            <p className="text-xs font-medium">
              £{Number(offer.offeredProduct.price).toFixed(2)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 flex-1 text-center">
            <div className="w-16 h-16 rounded-lg bg-default-100 flex items-center justify-center">
              <Icon
                icon="solar:dollar-minimalistic-linear"
                width={28}
                className="text-default-400"
              />
            </div>
            <p className="text-xs text-default-600">Cash offer</p>
            <p className="text-xs font-medium">£{cash.toFixed(2)}</p>
          </div>
        )}

        <Icon
          icon="solar:transfer-horizontal-linear"
          width={20}
          className="text-default-400 flex-shrink-0"
        />

        <div className="flex flex-col items-center gap-1 flex-1 text-center min-w-0">
          <Image
            src={offer.requestedProduct.images?.[0] || "/placeholder-product.jpg"}
            alt={offer.requestedProduct.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <p className="text-xs text-default-600 line-clamp-1">{offer.requestedProduct.title}</p>
          <p className="text-xs font-medium">
            £{Number(offer.requestedProduct.price).toFixed(2)}
          </p>
        </div>
      </div>

      {cash > 0 && offer.offeredProduct && (
        <p className="text-xs text-center text-default-400 mb-2">
          + £{cash.toFixed(2)} cash sweetener
        </p>
      )}

      {offer.status === "COUNTERED" && offer.counterCashAmount != null && (
        <div className="flex items-center justify-center gap-1 text-xs text-secondary mb-2">
          <Icon icon="solar:refresh-linear" width={12} />
          Counter: £{Number(offer.counterCashAmount).toFixed(2)} cash requested
        </div>
      )}

      {offer.status === "COMPLETED" ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <Icon icon="solar:check-circle-bold" width={16} className="text-success" />
          <span className="text-sm font-medium text-success">Trade Complete</span>
        </div>
      ) : (
        <div className="flex gap-2 mt-2">
          {actions.canCounter && (
            <Button
              size="sm"
              color="secondary"
              variant="flat"
              onPress={() => setCounterModalOpen(true)}
            >
              Counter
            </Button>
          )}
          {actions.canAccept && (
            <Button
              size="sm"
              color="success"
              variant="flat"
              isLoading={respondMutation.isPending}
              onPress={() =>
                respondMutation.mutate({ tradeOfferId: offer.id, response: "ACCEPTED" })
              }
            >
              Accept
            </Button>
          )}
          {actions.canDecline && (
            <Button
              size="sm"
              color="danger"
              variant="flat"
              isLoading={respondMutation.isPending}
              onPress={() =>
                respondMutation.mutate({ tradeOfferId: offer.id, response: "DECLINED" })
              }
            >
              Decline
            </Button>
          )}
          {actions.canCancel && (
            <Button
              size="sm"
              variant="flat"
              isLoading={cancelMutation.isPending}
              onPress={() => cancelMutation.mutate({ tradeOfferId: offer.id })}
            >
              Cancel Offer
            </Button>
          )}
          {actions.canUploadTracking && !showTrackingInput && (
            <Button size="sm" color="primary" onPress={() => setShowTrackingInput(true)}>
              Upload Tracking
            </Button>
          )}
          {actions.hasUploaded && !actions.canUploadTracking && (
            <div className="flex items-center gap-1 text-xs text-success">
              <Icon icon="solar:check-circle-bold" width={14} />
              Tracking uploaded
            </div>
          )}
          {actions.canPay && (
            <Button
              size="sm"
              color="primary"
              isLoading={paymentLinkMutation.isPending}
              onPress={() => paymentLinkMutation.mutate({ tradeOfferId: offer.id })}
            >
              Complete Payment
            </Button>
          )}
          {actions.isAwaitingPayment && (
            <div className="flex items-center gap-1 text-xs text-default-400">
              <Icon icon="solar:clock-circle-linear" width={14} />
              Waiting for buyer payment
            </div>
          )}
        </div>
      )}

      {showTrackingInput && (
        <div className="flex gap-2 mt-2">
          <Input
            size="sm"
            placeholder="Tracking number"
            value={trackingInput}
            onValueChange={setTrackingInput}
            className="flex-1"
          />
          <Button
            size="sm"
            color="primary"
            isLoading={trackingMutation.isPending}
            isDisabled={!trackingInput.trim()}
            onPress={() =>
              trackingMutation.mutate({
                tradeOfferId: offer.id,
                trackingNumber: trackingInput.trim(),
              })
            }
          >
            Submit
          </Button>
          <Button size="sm" variant="flat" onPress={() => setShowTrackingInput(false)}>
            Cancel
          </Button>
        </div>
      )}

      <CounterOfferModal
        isOpen={counterModalOpen}
        onClose={() => setCounterModalOpen(false)}
        tradeOfferId={offer.id}
        onSuccess={onUpdate}
      />
    </div>
  );
}
