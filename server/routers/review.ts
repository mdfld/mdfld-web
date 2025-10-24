import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const reviewRouter = createTRPCRouter({
  // Create a review
  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        orderId: z.string().optional(),
        rating: z.number().min(1).max(5),
        title: z.string().min(1).max(100).optional(),
        content: z.string().min(10).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get buyer profile
      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Buyer profile not found",
        });
      }

      // Get product with seller
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        include: { seller: true },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check if user has purchased this product (if orderId provided)
      let isVerified = false;
      if (input.orderId) {
        const order = await ctx.prisma.order.findFirst({
          where: {
            id: input.orderId,
            buyerProfileId: buyerProfile.id,
            items: {
              some: {
                productId: input.productId,
              },
            },
            status: { in: ["DELIVERED"] },
          },
        });

        if (order) {
          isVerified = true;
        }
      }

      // Check if user already reviewed this product
      const existingReview = await ctx.prisma.review.findFirst({
        where: {
          productId: input.productId,
          buyerProfileId: buyerProfile.id,
        },
      });

      if (existingReview) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already reviewed this product",
        });
      }

      // Create review
      const review = await ctx.prisma.review.create({
        data: {
          productId: input.productId,
          buyerProfileId: buyerProfile.id,
          sellerProfileId: product.sellerProfileId,
          orderId: input.orderId,
          rating: input.rating,
          title: input.title,
          content: input.content,
          isVerified,
        },
        include: {
          buyer: {
            include: {
              user: true,
            },
          },
        },
      });

      // Update seller's average rating
      const sellerReviews = await ctx.prisma.review.aggregate({
        where: {
          sellerProfileId: product.sellerProfileId,
        },
        _avg: {
          rating: true,
        },
        _count: true,
      });

      await ctx.prisma.sellerProfile.update({
        where: { id: product.sellerProfileId },
        data: {
          averageRating: sellerReviews._avg.rating || 0,
        },
      });

      // Send notification to seller
      if (product.seller.userId) {
        await ctx.prisma.notification.create({
          data: {
            userId: product.seller.userId,
            type: "REVIEW_RECEIVED",
            title: "New Review",
            content: `${ctx.user.name} left a ${input.rating}-star review on ${product.title}`,
            metadata: {
              reviewId: review.id,
              productId: product.id,
              rating: input.rating,
            },
          },
        });
      }

      return review;
    }),

  // Get reviews for a product
  getByProduct: publicProcedure
    .input(
      z.object({
        productId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        sortBy: z
          .enum(["recent", "helpful", "rating_high", "rating_low"])
          .default("recent"),
        filterRating: z.number().min(1).max(5).optional(),
        verifiedOnly: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        productId: input.productId,
      };

      if (input.filterRating) {
        where.rating = input.filterRating;
      }

      if (input.verifiedOnly) {
        where.isVerified = true;
      }

      let orderBy: any = { createdAt: "desc" };
      switch (input.sortBy) {
        case "helpful":
          orderBy = { isHelpful: "desc" };
          break;
        case "rating_high":
          orderBy = { rating: "desc" };
          break;
        case "rating_low":
          orderBy = { rating: "asc" };
          break;
      }

      const items = await ctx.prisma.review.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy,
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      // Get review statistics
      const stats = await ctx.prisma.review.groupBy({
        by: ["rating"],
        where: { productId: input.productId },
        _count: true,
      });

      const totalReviews = stats.reduce((sum, stat) => sum + stat._count, 0);
      const averageRating =
        totalReviews > 0
          ? stats.reduce((sum, stat) => sum + stat.rating * stat._count, 0) /
            totalReviews
          : 0;

      const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      stats.forEach((stat) => {
        ratingDistribution[stat.rating as keyof typeof ratingDistribution] =
          stat._count;
      });

      return {
        items,
        nextCursor,
        stats: {
          totalReviews,
          averageRating,
          ratingDistribution,
          verifiedReviews: await ctx.prisma.review.count({
            where: { productId: input.productId, isVerified: true },
          }),
        },
      };
    }),

  // Get reviews for a seller
  getBySeller: publicProcedure
    .input(
      z.object({
        sellerProfileId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.review.findMany({
        where: {
          sellerProfileId: input.sellerProfileId,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          product: true,
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  // Mark review as helpful
  markHelpful: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Simple implementation - in production, track who marked as helpful
      const review = await ctx.prisma.review.update({
        where: { id: input.reviewId },
        data: {
          isHelpful: {
            increment: 1,
          },
        },
      });

      return review;
    }),

  // Report a review
  report: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        reason: z.enum(["spam", "inappropriate", "fake", "other"]),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        include: {
          product: true,
        },
      });

      if (!review) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Mark review as suspicious
      await ctx.prisma.review.update({
        where: { id: input.reviewId },
        data: {
          isSuspicious: true,
        },
      });

      // Create fraud report
      await ctx.prisma.fraudReport.create({
        data: {
          reporterId: userId,
          productId: review.productId,
          reportType: "MISLEADING_INFO",
          description: `Review reported as ${input.reason}: ${input.description || "No additional details"}`,
          priority: "MEDIUM",
        },
      });

      return { success: true };
    }),

  // Get user's reviews
  getMyReviews: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        return { items: [], nextCursor: undefined };
      }

      const items = await ctx.prisma.review.findMany({
        where: {
          buyerProfileId: buyerProfile.id,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            include: {
              seller: true,
            },
          },
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  // Update a review (within 7 days)
  update: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        rating: z.number().min(1).max(5).optional(),
        title: z.string().min(1).max(100).optional(),
        content: z.string().min(10).max(1000).optional(),
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

      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        include: {
          seller: true,
        },
      });

      if (!review || review.buyerProfileId !== buyerProfile.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Check if review is within 7 days
      const daysSinceCreation = Math.floor(
        (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceCreation > 7) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reviews can only be edited within 7 days of posting",
        });
      }

      // Update review
      const updatedReview = await ctx.prisma.review.update({
        where: { id: input.reviewId },
        data: {
          rating: input.rating,
          title: input.title,
          content: input.content,
        },
      });

      // Update seller's average rating if rating changed
      if (input.rating && input.rating !== review.rating) {
        const sellerReviews = await ctx.prisma.review.aggregate({
          where: {
            sellerProfileId: review.sellerProfileId,
          },
          _avg: {
            rating: true,
          },
        });

        await ctx.prisma.sellerProfile.update({
          where: { id: review.sellerProfileId },
          data: {
            averageRating: sellerReviews._avg.rating || 0,
          },
        });
      }

      return updatedReview;
    }),

  // Delete a review (within 24 hours)
  delete: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
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

      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        include: {
          seller: true,
        },
      });

      if (!review || review.buyerProfileId !== buyerProfile.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found",
        });
      }

      // Check if review is within 24 hours
      const hoursSinceCreation = Math.floor(
        (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60),
      );

      if (hoursSinceCreation > 24) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reviews can only be deleted within 24 hours of posting",
        });
      }

      // Delete review
      await ctx.prisma.review.delete({
        where: { id: input.reviewId },
      });

      // Update seller's average rating
      const sellerReviews = await ctx.prisma.review.aggregate({
        where: {
          sellerProfileId: review.sellerProfileId,
        },
        _avg: {
          rating: true,
        },
      });

      await ctx.prisma.sellerProfile.update({
        where: { id: review.sellerProfileId },
        data: {
          averageRating: sellerReviews._avg.rating || 0,
        },
      });

      return { success: true };
    }),
});
