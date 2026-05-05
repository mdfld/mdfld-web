import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const returnRouter = createTRPCRouter({
  // Get all return requests for the authenticated user
  getMyReturns: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"])
          .optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        return [];
      }

      const where: any = {
        buyerProfileId: buyerProfile.id,
      };

      if (input.status) {
        where.status = input.status;
      }

      const returns = await ctx.prisma.returnRequest.findMany({
        where,
        take: input.limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              items: {
                select: {
                  quantity: true,
                  price: true,
                  product: {
                    select: {
                      title: true,
                      images: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return returns;
    }),

  // Create a new return request
  create: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.enum([
          "DEFECTIVE",
          "WRONG_ITEM",
          "NOT_AS_DESCRIBED",
          "CHANGED_MIND",
          "SIZE_ISSUE",
          "OTHER",
        ]),
        details: z.string().min(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Buyer profile not found",
        });
      }

      // Validate order exists and belongs to this buyer
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.buyerProfileId !== buyerProfile.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this order",
        });
      }

      // Order must be DELIVERED to request a return
      if (order.status !== "DELIVERED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Returns can only be requested for delivered orders",
        });
      }

      // Check for existing PENDING or APPROVED return for this order
      const existingReturn = await ctx.prisma.returnRequest.findFirst({
        where: {
          orderId: input.orderId,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });

      if (existingReturn) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A return request for this order is already pending or approved",
        });
      }

      const returnRequest = await ctx.prisma.returnRequest.create({
        data: {
          orderId: input.orderId,
          buyerProfileId: buyerProfile.id,
          reason: input.reason,
          details: input.details,
          status: "PENDING",
        },
      });

      return returnRequest;
    }),
});
