import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure, superAdminProcedure, protectedProcedure, publicProcedure } from "../trpc";
import { transferToSeller } from "@/lib/stripe-payouts";
import { sendPaypalPayout } from "@/lib/paypal-payouts";

export const adminRouter = createTRPCRouter({
  analytics: protectedProcedure.query(async ({ ctx }) => {
    // TODO: Add proper admin role check
    // For now, allow all authenticated users

    // Get total user count
    const userCount = await ctx.prisma.user.count();

    // Get total organization count
    const organizationCount = await ctx.prisma.organization.count();

    // Get users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUserCount = await ctx.prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get organizations created in last 30 days
    const recentOrganizationCount = await ctx.prisma.organization.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get total conversation count
    const conversationCount = await ctx.prisma.conversation.count();

    // Get total message count
    const messageCount = await ctx.prisma.message.count();

    // Get active users (users who sent messages in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await ctx.prisma.user.count({
      where: {
        messages: {
          some: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        },
      },
    });

    // Get daily user registrations for the last 7 days
    const dailyRegistrations = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const count = await ctx.prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        return {
          date: date.toISOString().split("T")[0],
          count,
        };
      }),
    );

    return {
      users: {
        total: userCount,
        recent: recentUserCount,
        active: activeUsers,
      },
      organizations: {
        total: organizationCount,
        recent: recentOrganizationCount,
      },
      conversations: {
        total: conversationCount,
      },
      messages: {
        total: messageCount,
      },
      dailyRegistrations: dailyRegistrations.reverse(),
    };
  }),

  // Stores Management
  listStores: adminProcedure
    .input(
      z.object({
        status: z.enum(["APPROVED", "SUSPENDED"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const stores = await ctx.prisma.organization.findMany({
        where: input.status ? { storeStatus: input.status } : undefined,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          sellerProfile: { select: { storeName: true, totalSales: true, pendingBalance: true } },
          members: {
            where: { role: "owner" },
            include: { user: { select: { name: true, email: true } } },
            take: 1,
          },
          _count: { select: { products: true } },
        },
      });
      let nextCursor: string | undefined;
      if (stores.length > input.limit) {
        nextCursor = stores.pop()!.id;
      }
      return { stores, nextCursor };
    }),

  suspendStore: adminProcedure
    .input(z.object({ organizationId: z.string(), suspend: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.prisma.organization.update({
        where: { id: input.organizationId },
        data: { storeStatus: input.suspend ? "SUSPENDED" : "APPROVED" },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          organizationId: input.organizationId,
          action: input.suspend ? "STORE_SUSPENDED" : "STORE_RESTORED",
          entityType: "Organization",
          entityId: input.organizationId,
        },
      });
      return org;
    }),

  deleteStore: adminProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          organizationId: input.organizationId,
          action: "STORE_DELETED",
          entityType: "Organization",
          entityId: input.organizationId,
        },
      });
      await ctx.prisma.organization.delete({ where: { id: input.organizationId } });
      return { success: true };
    }),

  // Task 6: Users, Products, Orders
  listUsers: adminProcedure
    .input(
      z.object({
        role: z.enum(["SUPER_ADMIN", "ADMIN", "SELLER", "BUYER"]).optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          AND: [
            input.role ? { role: input.role as any } : {},
            input.search
              ? {
                  OR: [
                    { email: { contains: input.search, mode: "insensitive" } },
                    { name: { contains: input.search, mode: "insensitive" } },
                    { username: { contains: input.search, mode: "insensitive" } },
                  ],
                }
              : {},
          ],
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          kycStatus: true,
          isVerifiedSeller: true,
          createdAt: true,
          sellerProfile: { select: { storeName: true, totalSales: true } },
        },
      });
      let nextCursor: string | undefined;
      if (users.length > input.limit) nextCursor = users.pop()!.id;
      return { users, nextCursor };
    }),

  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(["SUPER_ADMIN", "ADMIN", "SELLER", "BUYER"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role as any },
        select: { id: true, email: true, role: true },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "USER_ROLE_UPDATED",
          entityType: "User",
          entityId: input.userId,
          newValues: { role: input.role },
        },
      });
      return user;
    }),

  listProducts: adminProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        isActive: z.boolean().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.prisma.product.findMany({
        where: {
          AND: [
            input.organizationId ? { organizationId: input.organizationId } : {},
            input.isActive !== undefined ? { isActive: input.isActive } : {},
          ],
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          seller: { select: { storeName: true } },
          organization: { select: { name: true } },
          _count: { select: { orderItems: true } },
        },
      });
      let nextCursor: string | undefined;
      if (products.length > input.limit) nextCursor = products.pop()!.id;
      return { products, nextCursor };
    }),

  toggleFeatured: adminProcedure
    .input(z.object({ productId: z.string(), featured: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.product.update({
        where: { id: input.productId },
        data: { featured: input.featured },
        select: { id: true, featured: true },
      });
    }),

  deleteProduct: superAdminProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "PRODUCT_DELETED",
          entityType: "Product",
          entityId: input.productId,
        },
      });
      await ctx.prisma.product.delete({ where: { id: input.productId } });
      return { success: true };
    }),

  updateProduct: superAdminProcedure
    .input(
      z.object({
        productId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        inventory: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
        category: z
          .enum([
            "JERSEYS",
            "BOOTS",
            "FOOTBALLS",
            "TRADING_CARDS",
            "STICKERS",
            "GOALKEEPER_GLOVES",
            "SHIN_GUARDS",
            "TRAINING_EQUIPMENT",
            "ACCESSORIES",
          ])
          .optional(),
        subcategory: z.string().optional(),
        condition: z
          .enum([
            "BRAND_NEW",
            "NEW_WITH_TAGS",
            "NEW_WITHOUT_TAGS",
            "USED_LIKE_NEW",
            "USED_GOOD",
            "USED_FAIR",
          ])
          .optional(),
        tier: z.enum(["ELITE", "PRO", "ACADEMY", "CLUB"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, ...rest } = input;
      const updateData = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined),
      );

      const previous = await ctx.prisma.product.findUnique({ where: { id: productId } });

      const updated = await ctx.prisma.product.update({
        where: { id: productId },
        data: updateData as any,
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "PRODUCT_UPDATED",
          entityType: "Product",
          entityId: productId,
          oldValues: previous as any,
          newValues: updateData,
        },
      });

      return updated;
    }),

  listOrders: adminProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const orders = await ctx.prisma.order.findMany({
        where: input.status ? { status: input.status } : undefined,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { include: { user: { select: { name: true, email: true } } } },
          seller: { select: { storeName: true } },
          items: { include: { product: { select: { title: true, images: true } } } },
        },
      });
      let nextCursor: string | undefined;
      if (orders.length > input.limit) nextCursor = orders.pop()!.id;
      return { orders, nextCursor };
    }),

  getOrder: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          buyer: { include: { user: { select: { name: true, email: true } } } },
          seller: { select: { storeName: true, businessEmail: true, pendingBalance: true } },
          items: { include: { product: true, variant: true } },
          transactions: true,
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      return order;
    }),

  // Task 7: Payments Dashboard + Settlement
  getPaymentsSummary: adminProcedure.query(async ({ ctx }) => {
    const [totalCollectedResult, commissionResult, pendingResult, settledResult] =
      await Promise.all([
        ctx.prisma.order.aggregate({
          _sum: { total: true },
          where: { paymentStatus: "CAPTURED" },
        }),
        ctx.prisma.order.aggregate({
          _sum: { applicationFeeAmount: true },
          where: { paymentStatus: "CAPTURED" },
        }),
        ctx.prisma.sellerProfile.aggregate({
          _sum: { pendingBalance: true },
        }),
        ctx.prisma.sellerProfile.aggregate({
          _sum: { settledBalance: true },
        }),
      ]);

    return {
      totalCollected: totalCollectedResult._sum.total ?? 0,
      totalCommission: commissionResult._sum.applicationFeeAmount ?? 0,
      totalOwedToSellers: pendingResult._sum.pendingBalance ?? 0,
      totalSettled: settledResult._sum.settledBalance ?? 0,
    };
  }),

  listSellerBalances: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const sellers = await ctx.prisma.sellerProfile.findMany({
        where: { pendingBalance: { gt: 0 } },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { pendingBalance: "desc" },
        select: {
          id: true,
          storeName: true,
          businessEmail: true,
          pendingBalance: true,
          settledBalance: true,
          payoutMethod:     true,
          stripeBankLast4:  true,
          paypalEmail:      true,
          payoutSetupAt:    true,
          payoutRequestedAt: true,
          user: { select: { name: true, email: true } },
        },
      });
      let nextCursor: string | undefined;
      if (sellers.length > input.limit) nextCursor = sellers.pop()!.id;
      return { sellers, nextCursor };
    }),

  getPublicFees: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
      select: { buyerMarketplaceFee: true },
    });
    return { buyerMarketplaceFee: settings.buyerMarketplaceFee };
  }),

  getPlatformSettings: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.platformSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });
  }),

  updatePlatformSettings: adminProcedure
    .input(z.object({
      sellerCommissionPct:   z.number().min(0).max(1),
      buyerMarketplaceFee:   z.number().min(0).max(1),
      shippingMarkupPct:     z.number().min(0).max(2),
      shippingFlatRateCents: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const settings = await ctx.prisma.platformSettings.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", ...input, updatedById: ctx.user.id },
        update: { ...input, updatedById: ctx.user.id },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "PLATFORM_SETTINGS_UPDATED",
          entityType: "PlatformSettings",
          entityId: "singleton",
          newValues: input,
        },
      });
      return settings;
    }),

  triggerPayout: adminProcedure
    .input(z.object({
      sellerProfileId: z.string(),
      amount:          z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const seller = await ctx.prisma.sellerProfile.findUnique({
        where:   { id: input.sellerProfileId },
        include: { user: true },
      });

      if (!seller) throw new TRPCError({ code: "NOT_FOUND", message: "Seller not found" });

      if (!seller.payoutMethod) {
        throw new TRPCError({
          code:    "PRECONDITION_FAILED",
          message: "Seller has not set up a payout method",
        });
      }

      const pendingCents = Math.round(Number(seller.pendingBalance) * 100);
      const amountCents  = Math.round(input.amount * 100);
      if (amountCents > pendingCents) {
        throw new TRPCError({
          code:    "BAD_REQUEST",
          message: `Payout amount exceeds pending balance ($${seller.pendingBalance})`,
        });
      }

      // Stable across retries of the same trigger (payoutRequestedAt only
      // changes when the seller submits a new payout request), so a
      // double-click or retry within Stripe's idempotency window reuses
      // the same transfer instead of double-paying. When there's no
      // payoutRequestedAt (a manual payout), fall back to a random value
      // so two distinct manual payouts don't collide on the same Stripe
      // idempotency key.
      const idempotencyKey = `payout-${input.sellerProfileId}-${amountCents}-${
        seller.payoutRequestedAt ? seller.payoutRequestedAt.getTime() : `manual-${crypto.randomUUID()}`
      }`;

      // Execute the real payout - must succeed before touching the DB
      let transferId: string;
      let destination: string;

      if (seller.payoutMethod === "STRIPE_BANK") {
        if (!seller.stripeAccountId) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seller Stripe account not found" });
        }
        const { transferId: tid } = await transferToSeller({
          stripeAccountId: seller.stripeAccountId,
          amountCents,
          reference:       input.sellerProfileId,
          idempotencyKey,
        });
        transferId  = tid;
        destination = `••••${seller.stripeBankLast4}`;
      } else {
        if (!seller.paypalEmail) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seller PayPal email not found" });
        }
        // PayPal payouts are processed asynchronously: a successful response
        // here means the batch was accepted (status PENDING), not that funds
        // have settled. Individual items can still fail after submission.
        const { payoutBatchId } = await sendPaypalPayout({
          paypalEmail:  seller.paypalEmail,
          amountUsd:    input.amount.toFixed(2),
          senderItemId: `${input.sellerProfileId}-${Date.now()}`,
        });
        transferId  = payoutBatchId;
        destination = seller.paypalEmail;
      }

      // Payout succeeded - record atomically
      await ctx.prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            userId:          seller.userId!,
            type:            "PAYOUT",
            amount:          input.amount,
            status:          "COMPLETED",
            paymentMethod:   seller.payoutMethod === "STRIPE_BANK" ? "STRIPE" : "PAYPAL",
            netAmount:       input.amount,
            stripeTransferId: seller.payoutMethod === "STRIPE_BANK" ? transferId : null,
            paypalPayoutId:   seller.payoutMethod === "PAYPAL"       ? transferId : null,
          },
        });

        await tx.sellerProfile.update({
          where: { id: input.sellerProfileId },
          data: {
            pendingBalance:    { decrement: input.amount },
            settledBalance:    { increment: input.amount },
            payoutRequestedAt: null,
          },
        });

        await tx.auditLog.create({
          data: {
            userId:     ctx.user.id,
            action:     "PAYOUT_TRIGGERED",
            entityType: "SellerProfile",
            entityId:   input.sellerProfileId,
            newValues:  { amount: input.amount, transferId, method: seller.payoutMethod },
          },
        });

        await tx.notification.create({
          data: {
            userId:  seller.userId!,
            type:    "PAYOUT_COMPLETED",
            title:   "Payment sent",
            content: `$${input.amount.toFixed(2)} has been sent to your ${seller.payoutMethod === "STRIPE_BANK" ? "bank account" : "PayPal"} and should arrive within 1 to 2 business days.`,
            metadata: { transferId, amount: input.amount, method: seller.payoutMethod },
          },
        });
      });

      return {
        sellerName:  seller.storeName,
        amount:      input.amount,
        method:      seller.payoutMethod,
        destination,
        transferId,
        timestamp:   new Date(),
      };
    }),
});
