import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const notificationRouter = createTRPCRouter({
  // Get all notifications for the current user
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
        filter: z.enum(["all", "unread"]).optional().default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, filter } = input;
      const userId = ctx.user.id;

      const where: any = { userId };

      if (filter === "unread") {
        where.isRead = false;
      }

      const notifications = await ctx.prisma.notification.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem!.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  // Get unread count
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.prisma.notification.count({
      where: {
        userId: ctx.user.id,
        isRead: false,
      },
    });

    return count;
  }),

  // Mark a notification as read
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const notification = await ctx.prisma.notification.findFirst({
        where: {
          id: input.notificationId,
          userId: ctx.user.id,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      return ctx.prisma.notification.update({
        where: { id: input.notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.notification.updateMany({
      where: {
        userId: ctx.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }),

  // Create a notification (for testing)
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "ORDER_UPDATE",
          "PAYMENT_SUCCESS",
          "PAYMENT_FAILED",
          "FRAUD_ALERT",
          "REVIEW_RECEIVED",
          "SYSTEM_ANNOUNCEMENT",
          "NEW_MESSAGE",
          "MESSAGE_READ",
        ] as const),
        title: z.string(),
        content: z.string(),
        metadata: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.create({
        data: {
          userId: ctx.user.id,
          type: input.type,
          title: input.title,
          content: input.content,
          metadata: input.metadata || null,
        },
      });
    }),
});
