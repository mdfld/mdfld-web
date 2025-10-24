import { createTRPCRouter, protectedProcedure } from "../trpc";

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
});
