import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "../trpc";
import { stripe, STRIPE_ACCOUNT_TYPE, SELLER_CAPABILITIES } from "@/lib/stripe";
import { TRPCError } from "@trpc/server";

export const stripeRouter = createTRPCRouter({
  // Create Stripe Connect account for seller
  createConnectAccount: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        email: z.string().email(),
        country: z.string().default("US"),
        businessType: z.enum(["individual", "company"]).default("individual"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user already has a seller profile
      let sellerProfile = await ctx.prisma.sellerProfile.findFirst({
        where: {
          OR: [
            { userId },
            input.organizationId
              ? { organizationId: input.organizationId }
              : {},
          ].filter(Boolean),
        },
      });

      // Create seller profile if it doesn't exist
      if (!sellerProfile) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        sellerProfile = await ctx.prisma.sellerProfile.create({
          data: {
            userId: input.organizationId ? null : userId,
            organizationId: input.organizationId,
            storeName: user.name || "My Store",
            businessEmail: input.email,
          },
        });
      }

      // Check if already has Stripe account
      if (sellerProfile.stripeAccountId) {
        // Return existing account info
        const account = await stripe.accounts.retrieve(
          sellerProfile.stripeAccountId,
        );
        return {
          accountId: account.id,
          onboardingComplete: sellerProfile.stripeOnboardingComplete,
          accountLink: null,
        };
      }

      // Create Stripe Connect account
      const account = await stripe.accounts.create({
        type: STRIPE_ACCOUNT_TYPE as any,
        email: input.email,
        country: input.country,
        business_type: input.businessType as any,
        capabilities: SELLER_CAPABILITIES,
        metadata: {
          userId,
          sellerProfileId: sellerProfile.id,
          organizationId: input.organizationId || "",
        },
      });

      // Update seller profile with Stripe account ID
      await ctx.prisma.sellerProfile.update({
        where: { id: sellerProfile.id },
        data: {
          stripeAccountId: account.id,
          stripeAccountStatus: "pending",
        },
      });

      // Create account link for onboarding
      // Detect if we're in live mode
      const isLiveMode = !process.env.STRIPE_SECRET_KEY?.includes("_test_");

      // Use production URL for live mode, otherwise use env URL
      let baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "";

      // If in live mode and URL is localhost, use production URL
      if (
        isLiveMode &&
        (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))
      ) {
        // You need to set this to your production URL
        baseUrl =
          process.env.NEXT_PUBLIC_PRODUCTION_URL || "https://yourdomain.com";
      }

      // Ensure HTTPS for production/live mode
      const secureUrl = baseUrl.replace(/^http:/, "https:");

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${secureUrl}/dashboard/settings?stripe=refresh`,
        return_url: `${secureUrl}/dashboard/settings?stripe=success`,
        type: "account_onboarding",
      });

      return {
        accountId: account.id,
        onboardingComplete: false,
        accountLink: accountLink.url,
      };
    }),

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

  // Create new onboarding link
  createAccountLink: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No Stripe account found",
        });
      }

      // Detect if we're in live mode
      const isLiveMode = !process.env.STRIPE_SECRET_KEY?.includes("_test_");

      // Use production URL for live mode, otherwise use env URL
      let baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "";

      // If in live mode and URL is localhost, use production URL
      if (
        isLiveMode &&
        (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1"))
      ) {
        // You need to set this to your production URL
        baseUrl =
          process.env.NEXT_PUBLIC_PRODUCTION_URL || "https://yourdomain.com";
      }

      // Ensure HTTPS for production/live mode
      const secureUrl = baseUrl.replace(/^http:/, "https:");

      const accountLink = await stripe.accountLinks.create({
        account: sellerProfile.stripeAccountId,
        refresh_url: `${secureUrl}/dashboard/settings?stripe=refresh`,
        return_url: `${secureUrl}/dashboard/settings?stripe=success`,
        type: "account_onboarding",
      });

      return {
        url: accountLink.url,
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
