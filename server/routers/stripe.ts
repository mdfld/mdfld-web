import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "../trpc";
import { stripe } from "@/lib/stripe";
import { TRPCError } from "@trpc/server";

export const stripeRouter = createTRPCRouter({
  // Get Stripe account status
  getAccountStatus: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const sellerProfile = await ctx.prisma.sellerProfile.findFirst({
        where: {
          OR: [
            { userId },
            input.organizationId
              ? { organizationId: input.organizationId }
              : {},
          ].filter(Boolean),
        },
      });

      if (!sellerProfile || !sellerProfile.stripeAccountId) {
        return {
          hasAccount: false,
          onboardingComplete: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          requirements: null,
        };
      }

      // Get latest account info from Stripe
      const account = await stripe.accounts.retrieve(
        sellerProfile.stripeAccountId,
      );

      // Update local data if needed
      if (
        account.charges_enabled !== sellerProfile.stripeChargesEnabled ||
        account.payouts_enabled !== sellerProfile.stripePayoutsEnabled
      ) {
        await ctx.prisma.sellerProfile.update({
          where: { id: sellerProfile.id },
          data: {
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
            stripeDetailsSubmitted: account.details_submitted,
            stripeOnboardingComplete:
              account.charges_enabled &&
              account.payouts_enabled &&
              account.details_submitted,
            stripeRequirements: account.requirements as any,
            stripeCapabilities: account.capabilities as any,
          },
        });
      }

      return {
        hasAccount: true,
        accountId: account.id,
        onboardingComplete: account.charges_enabled && account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
      };
    }),

  // Get or create Stripe customer
  getOrCreateCustomer: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Return existing customer ID if exists
    if (user.stripeCustomerId) {
      return {
        customerId: user.stripeCustomerId,
      };
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    });

    // Update user with customer ID
    await ctx.prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: customer.id,
      },
    });

    return {
      customerId: customer.id,
    };
  }),

  // Get commission rate for a seller
  getCommissionRate: protectedProcedure
    .input(
      z.object({
        sellerProfileId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sellerProfile = await ctx.prisma.sellerProfile.findUnique({
        where: { id: input.sellerProfileId },
      });

      if (!sellerProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller not found",
        });
      }

      return {
        commissionRate: sellerProfile.commissionRate,
      };
    }),
});
