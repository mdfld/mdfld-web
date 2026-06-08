import { prisma } from "@/lib/prisma";

export async function handleTradeCashPayment(
  checkoutSession: { id: string; metadata: Record<string, string> | null },
) {
  const metadata = checkoutSession.metadata || {};
  const tradeOfferId = metadata.tradeOfferId;
  if (!tradeOfferId) {
    console.error("[Webhook] TRADE_CASH_PAYMENT: no tradeOfferId in metadata");
    return;
  }

  const offer = await prisma.tradeOffer.findUnique({ where: { id: tradeOfferId } });

  if (!offer || offer.status !== "AWAITING_PAYMENT") {
    console.log("[Webhook] TRADE_CASH_PAYMENT: offer not AWAITING_PAYMENT, skipping");
    return;
  }

  await prisma.tradeOffer.update({ where: { id: tradeOfferId }, data: { status: "ACCEPTED" } });

  if (offer.offeredProductId) {
    await prisma.product.update({ where: { id: offer.offeredProductId }, data: { isActive: false } });
  }

  await prisma.notification.create({
    data: {
      userId: offer.proposerId,
      type: "TRADE_OFFER_ACCEPTED",
      title: "Payment received — time to ship!",
      content: "Your payment was received. Trade confirmed. Time to ship!",
      metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
    },
  });
  await prisma.notification.create({
    data: {
      userId: offer.recipientId,
      type: "TRADE_OFFER_ACCEPTED",
      title: "Payment received — time to ship!",
      content: "The buyer paid. Trade confirmed. Time to ship your item!",
      metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
    },
  });
}
