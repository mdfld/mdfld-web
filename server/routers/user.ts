import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const userRouter = createTRPCRouter({
  // Search users by email or username
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).optional().default(10),
        excludeIds: z.array(z.string()).optional().default([]),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { email: { contains: input.query, mode: "insensitive" } },
                { username: { contains: input.query, mode: "insensitive" } },
                { name: { contains: input.query, mode: "insensitive" } },
              ],
            },
            {
              id: {
                not: ctx.user.id, // Exclude current user
              },
            },
            // Exclude additional IDs if provided
            ...(input.excludeIds && input.excludeIds.length > 0
              ? [{ id: { notIn: input.excludeIds } }]
              : []),
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
        },
        take: input.limit,
      });

      return users;
    }),

  // Get user by ID
  getById: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          createdAt: true,
        },
      });

      return user;
    }),

  // Get multiple users by IDs
  getMany: protectedProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          id: { in: input.userIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
        },
      });

      return users;
    }),

  // Get user's wishlist
  getWishlist: protectedProcedure.query(async ({ ctx }) => {
    const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
      where: { userId: ctx.user.id },
      select: {
        wishlist: true,
      },
    });

    if (!buyerProfile || buyerProfile.wishlist.length === 0) return [];

    // Get full product details for wishlist items
    const products = await ctx.prisma.product.findMany({
      where: {
        id: { in: buyerProfile.wishlist },
        isActive: true,
      },
      include: {
        seller: {
          select: {
            id: true,
            storeName: true,
            averageRating: true,
          },
        },
      },
    });

    return products;
  }),

  // Add product to wishlist
  addToWishlist: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if product exists and is active
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        select: { id: true, isActive: true },
      });

      if (!product || !product.isActive) {
        throw new Error("Product not found or unavailable");
      }

      // Create or update buyer profile
      const buyerProfile = await ctx.prisma.buyerProfile.upsert({
        where: { userId: ctx.user.id },
        update: {
          wishlist: {
            push: input.productId,
          },
        },
        create: {
          userId: ctx.user.id,
          wishlist: [input.productId],
        },
      });

      return { success: true };
    }),

  // Remove product from wishlist
  removeFromWishlist: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current wishlist
      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { wishlist: true },
      });

      if (!buyerProfile) {
        throw new Error("Buyer profile not found");
      }

      // Remove from wishlist
      const updatedWishlist = buyerProfile.wishlist.filter(
        (id: string) => id !== input.productId,
      );

      await ctx.prisma.buyerProfile.update({
        where: { userId: ctx.user.id },
        data: {
          wishlist: updatedWishlist,
        },
      });

      return { success: true };
    }),

  // Check if products are in wishlist
  checkWishlist: protectedProcedure
    .input(
      z.object({
        productIds: z.array(z.string()),
      }),
    )
    .query(async ({ ctx, input }) => {
      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId: ctx.user.id },
        select: { wishlist: true },
      });

      if (!buyerProfile) return {};

      // Create a map of productId -> isWishlisted
      const wishlistMap: Record<string, boolean> = {};
      input.productIds.forEach((id) => {
        wishlistMap[id] = buyerProfile.wishlist.includes(id);
      });

      return wishlistMap;
    }),
});
