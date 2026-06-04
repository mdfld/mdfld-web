import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { AES256E2EE } from "@/lib/aes-e2ee";

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
});
