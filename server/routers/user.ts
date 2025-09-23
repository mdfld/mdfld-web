import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";

export const userRouter = createTRPCRouter({
  // Search users by email or username
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
        excludeIds: z.array(z.string()).optional(),
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
});
