import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { AES256E2EE } from "@/lib/aes-e2ee";
import { stripe } from "@/lib/stripe";

export const tradeRouter = createTRPCRouter({
  proposeOffer: protectedProcedure
    .input(
      z.object({
        requestedProductId: z.string(),
        offeredProductId: z.string().optional(),
        cashAmount: z.number().nonnegative().optional(),
        message: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.offeredProductId && (!input.cashAmount || input.cashAmount <= 0)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Must offer an item or a cash amount greater than 0",
        });
      }

      const requestedProduct = await ctx.prisma.product.findUnique({
        where: { id: input.requestedProductId },
        include: { seller: { select: { userId: true, organizationId: true } } },
      });

      if (!requestedProduct) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (!(requestedProduct as any).tradeEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This listing does not accept trade offers",
        });
      }

      if (requestedProduct.seller.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot propose a trade on your own listing",
        });
      }

      if (input.offeredProductId) {
        const offeredProduct = await ctx.prisma.product.findUnique({
          where: { id: input.offeredProductId },
          include: { seller: { select: { userId: true } } },
        });
        if (!offeredProduct || offeredProduct.seller.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only offer products you own",
          });
        }
      }

      const existingOffer = await ctx.prisma.tradeOffer.findFirst({
        where: {
          proposerId: ctx.user.id,
          requestedProductId: input.requestedProductId,
          status: "PENDING",
        },
      });

      if (existingOffer) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pending trade offer on this listing",
        });
      }

      const recipientId = requestedProduct.seller.userId!;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [conversation, tradeOffer] = await ctx.prisma.$transaction(async (tx: any) => {
        const conv = await tx.conversation.create({
          data: {
            type: "TRADE",
            participants: {
              create: [
                { userId: ctx.user.id, role: "admin" },
                { userId: recipientId, role: "member" },
              ],
            },
          },
        });

        const offer = await tx.tradeOffer.create({
          data: {
            conversationId: conv.id,
            proposerId: ctx.user.id,
            recipientId,
            requestedProductId: input.requestedProductId,
            offeredProductId: input.offeredProductId ?? null,
            cashAmount: input.cashAmount ?? null,
            expiresAt,
          },
        });

        return [conv, offer];
      });

      if (input.message) {
        const participantIds = [ctx.user.id, recipientId];
        const encryptedVersions = AES256E2EE.encryptForConversation(
          input.message,
          ctx.user.id,
          participantIds,
        );
        await ctx.prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: ctx.user.id,
            content: JSON.stringify(encryptedVersions),
            type: "TEXT",
            status: "SENT",
          },
        });
      }

      await ctx.prisma.notification.create({
        data: {
          userId: recipientId,
          type: "TRADE_OFFER_RECEIVED",
          title: `New trade offer from ${ctx.user.name}`,
          content: "You have a new trade offer on your listing",
          metadata: {
            tradeOfferId: tradeOffer.id,
            conversationId: conversation.id,
            proposerName: ctx.user.name,
          },
        },
      });

      return { tradeOfferId: tradeOffer.id, conversationId: conversation.id };
    }),

  counterOffer: protectedProcedure
    .input(
      z.object({
        tradeOfferId: z.string(),
        counterCashAmount: z.number().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.counterCashAmount || input.counterCashAmount <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Counter offer must include a cash amount greater than 0" });
      }

      const offer = await ctx.prisma.tradeOffer.findUnique({ where: { id: input.tradeOfferId } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Trade offer not found" });
      if (offer.recipientId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the recipient can counter an offer" });
      if (offer.status !== "PENDING") throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending offers can be countered" });

      const updated = await ctx.prisma.tradeOffer.update({
        where: { id: input.tradeOfferId },
        data: {
          status: "COUNTERED",
          counterCashAmount: input.counterCashAmount,
          counterById: ctx.user.id,
        },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: offer.proposerId,
          type: "TRADE_OFFER_COUNTERED",
          title: `Counter offer from ${ctx.user.name}`,
          content: "The recipient has proposed different terms for your trade offer.",
          metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
        },
      });

      return updated;
    }),

  respondToOffer: protectedProcedure
    .input(z.object({ tradeOfferId: z.string(), response: z.enum(["ACCEPTED", "DECLINED"]) }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.prisma.tradeOffer.findUnique({ where: { id: input.tradeOfferId } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Trade offer not found" });

      if (offer.status === "PENDING" && offer.recipientId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the recipient can respond" });
      }
      if (offer.status === "COUNTERED" && offer.proposerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the proposer can respond to a counter offer" });
      }
      if (offer.status !== "PENDING" && offer.status !== "COUNTERED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Offer is no longer pending" });
      }

      if (input.response === "DECLINED") {
        const updated = await ctx.prisma.tradeOffer.update({
          where: { id: input.tradeOfferId },
          data: { status: "DECLINED" },
        });
        if (offer.offeredProductId) {
          await ctx.prisma.product.update({ where: { id: offer.offeredProductId }, data: { isActive: true } });
        }
        await ctx.prisma.notification.create({
          data: {
            userId: offer.proposerId,
            type: "TRADE_OFFER_DECLINED",
            title: "Trade offer declined",
            content: "Your trade offer was declined.",
            metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
          },
        });
        return updated;
      }

      // ACCEPTED path — use counter terms if this was a countered offer
      const cashAmount = offer.status === "COUNTERED"
        ? (offer.counterCashAmount ? Number(offer.counterCashAmount) : 0)
        : (offer.cashAmount ? Number(offer.cashAmount) : 0);

      if (cashAmount > 0) {
        const settings = await ctx.prisma.platformSettings.upsert({
          where: { id: "singleton" },
          create: { id: "singleton" },
          update: {},
          select: { buyerMarketplaceFee: true },
        });
        const fee = settings.buyerMarketplaceFee ?? 0;
        const chargeAmount = Math.ceil(cashAmount * (1 + fee) * 100);

        const proposer = await ctx.prisma.user.findUnique({
          where: { id: offer.proposerId },
          select: { stripeCustomerId: true },
        });

        // Stripe session is created before the DB update. If the update fails, the session is
        // orphaned (active but points to a PENDING offer). The webhook no-ops a non-AWAITING_PAYMENT
        // offer, so any payment on an orphaned session requires a manual refund. Sessions expire after 24h.
        const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL!;
        const session = await stripe.checkout.sessions.create({
          customer: proposer?.stripeCustomerId ?? undefined,
          mode: "payment",
          line_items: [{
            price_data: {
              currency: "gbp",
              product_data: { name: "Cash sweetener" },
              unit_amount: chargeAmount,
            },
            quantity: 1,
          }],
          metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId, type: "TRADE_CASH_PAYMENT" },
          success_url: `${baseUrl}/dashboard/trades?payment=success`,
          cancel_url: `${baseUrl}/dashboard/inbox?conversation=${offer.conversationId}`,
        });

        const updated = await ctx.prisma.tradeOffer.update({
          where: { id: input.tradeOfferId },
          data: { status: "AWAITING_PAYMENT", cashStripeSessionId: session.id },
        });

        await ctx.prisma.notification.create({
          data: {
            userId: offer.proposerId,
            type: "TRADE_OFFER_ACCEPTED",
            title: "Trade accepted — complete your payment",
            content: "Your trade offer was accepted. Complete payment to confirm.",
            metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
          },
        });

        return updated;
      }

      // Pure item swap — no cash
      const updated = await ctx.prisma.tradeOffer.update({
        where: { id: input.tradeOfferId },
        data: { status: "ACCEPTED" },
      });

      if (offer.offeredProductId) {
        await ctx.prisma.product.update({ where: { id: offer.offeredProductId }, data: { isActive: false } });
      }

      await ctx.prisma.notification.create({
        data: {
          userId: offer.proposerId,
          type: "TRADE_OFFER_ACCEPTED",
          title: "Trade offer accepted!",
          content: "Your trade offer was accepted. Time to ship!",
          metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
        },
      });

      return updated;
    }),

  cancelOffer: protectedProcedure
    .input(z.object({ tradeOfferId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.prisma.tradeOffer.findUnique({ where: { id: input.tradeOfferId } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Trade offer not found" });
      if (offer.proposerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the proposer can cancel" });
      if (offer.status !== "PENDING" && offer.status !== "AWAITING_PAYMENT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only pending or awaiting-payment offers can be cancelled" });
      }
      const updated = await ctx.prisma.tradeOffer.update({
        where: { id: input.tradeOfferId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      if (offer.offeredProductId) {
        await ctx.prisma.product.update({ where: { id: offer.offeredProductId }, data: { isActive: true } });
      }
      // Expire the Stripe session so the buyer cannot pay a cancelled trade
      if (offer.status === "AWAITING_PAYMENT" && offer.cashStripeSessionId) {
        try {
          await stripe.checkout.sessions.expire(offer.cashStripeSessionId);
        } catch {
          // Session may already be expired or paid — not fatal, webhook no-ops a non-AWAITING_PAYMENT offer
        }
      }
      return updated;
    }),

  getPaymentLink: protectedProcedure
    .input(z.object({ tradeOfferId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.prisma.tradeOffer.findUnique({ where: { id: input.tradeOfferId } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Trade offer not found" });
      if (offer.proposerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the proposer can get the payment link" });
      if (offer.status !== "AWAITING_PAYMENT") throw new TRPCError({ code: "BAD_REQUEST", message: "Trade is not awaiting payment" });
      // cashFromProposer is always true in the current product — proposer pays the cash sweetener
      if (!offer.cashAmount || Number(offer.cashAmount) <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Trade has no cash sweetener" });

      const cashAmount = Number(offer.cashAmount);
      const settings = await ctx.prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton" },
        update: {},
        select: { buyerMarketplaceFee: true },
      });
      const fee = settings.buyerMarketplaceFee ?? 0;
      const chargeAmount = Math.ceil(cashAmount * (1 + fee) * 100);

      const proposer = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { stripeCustomerId: true },
      });

      const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL!;
      const session = await stripe.checkout.sessions.create({
        customer: proposer?.stripeCustomerId ?? undefined,
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "gbp",
            product_data: { name: "Cash sweetener" },
            unit_amount: chargeAmount,
          },
          quantity: 1,
        }],
        metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId, type: "TRADE_CASH_PAYMENT" },
        success_url: `${baseUrl}/dashboard/trades?payment=success`,
        cancel_url: `${baseUrl}/dashboard/inbox?conversation=${offer.conversationId}`,
      });

      await ctx.prisma.tradeOffer.update({
        where: { id: input.tradeOfferId },
        data: { cashStripeSessionId: session.id },
      });

      if (!session.url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe did not return a checkout URL" });
      return { url: session.url };
    }),

  uploadTracking: protectedProcedure
    .input(z.object({ tradeOfferId: z.string(), trackingNumber: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.prisma.tradeOffer.findUnique({ where: { id: input.tradeOfferId } });
      if (!offer) throw new TRPCError({ code: "NOT_FOUND", message: "Trade offer not found" });
      const isProposer = offer.proposerId === ctx.user.id;
      const isRecipient = offer.recipientId === ctx.user.id;
      if (!isProposer && !isRecipient) throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant in this trade" });
      if (offer.status !== "ACCEPTED" && offer.status !== "SHIPPING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Tracking can only be uploaded once the offer is accepted" });
      }
      const trackingUpdate = isProposer
        ? { proposerTrackingNumber: input.trackingNumber, proposerShippedAt: new Date() }
        : { recipientTrackingNumber: input.trackingNumber, recipientShippedAt: new Date() };
      const proposerTracking = isProposer ? input.trackingNumber : offer.proposerTrackingNumber;
      const recipientTracking = isRecipient ? input.trackingNumber : offer.recipientTrackingNumber;
      const bothShipped = !!proposerTracking && !!recipientTracking;
      const updated = await ctx.prisma.tradeOffer.update({
        where: { id: input.tradeOfferId },
        data: { ...trackingUpdate, status: bothShipped ? "COMPLETED" : "SHIPPING", ...(bothShipped && { completedAt: new Date() }) },
      });
      const otherId = isProposer ? offer.recipientId : offer.proposerId;
      await ctx.prisma.notification.create({
        data: {
          userId: otherId,
          type: bothShipped ? "TRADE_OFFER_COMPLETED" : "TRADE_OFFER_SHIPPED",
          title: bothShipped ? "Trade complete!" : "Your trade partner has shipped",
          content: bothShipped ? "Both items have shipped. Trade complete!" : `${ctx.user.name} has shipped their item.`,
          metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
        },
      });
      if (bothShipped) {
        await ctx.prisma.notification.create({
          data: {
            userId: ctx.user.id,
            type: "TRADE_OFFER_COMPLETED",
            title: "Trade complete!",
            content: "Both items have shipped. Trade complete!",
            metadata: { tradeOfferId: offer.id, conversationId: offer.conversationId },
          },
        });
      }
      return updated;
    }),

  getMyOffers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.tradeOffer.findMany({
      where: { OR: [{ proposerId: ctx.user.id }, { recipientId: ctx.user.id }] },
      include: {
        requestedProduct: { select: { id: true, title: true, price: true, images: true } },
        offeredProduct: { select: { id: true, title: true, price: true, images: true } },
        proposer: { select: { id: true, name: true, image: true } },
        recipient: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getOfferByConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ctx.prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId: input.conversationId, userId: ctx.user.id } },
      });
      if (!participant) throw new TRPCError({ code: "FORBIDDEN", message: "Not a participant" });
      return ctx.prisma.tradeOffer.findUnique({
        where: { conversationId: input.conversationId },
        include: {
          requestedProduct: { select: { id: true, title: true, price: true, images: true } },
          offeredProduct: { select: { id: true, title: true, price: true, images: true } },
          proposer: { select: { id: true, name: true, image: true } },
          recipient: { select: { id: true, name: true, image: true } },
        },
      });
    }),
});
