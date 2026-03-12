import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY!;

// Platform fee rate (10% commission)
export const PLATFORM_FEE_RATE = 0.1;

// Stripe account types
export const STRIPE_ACCOUNT_TYPE = "standard";

// Stripe capabilities required for sellers
export const SELLER_CAPABILITIES = {
  card_payments: { requested: true },
  transfers: { requested: true },
};

// Helper function to calculate application fee
export function calculateApplicationFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_RATE);
}

// Helper function to format amount for Stripe (convert to cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Helper function to format amount from Stripe (convert from cents)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}