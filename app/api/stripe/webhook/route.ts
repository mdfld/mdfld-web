import { NextRequest } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature") as string;

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    // Webhook signature verification failed
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      case "account.application.authorized": {
        // Application authorized
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeSucceeded(charge);
        break;
      }

      case "transfer.created": {
        // Transfer created
        break;
      }

      case "payout.created": {
        // Payout created
        break;
      }

      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(customer);
        break;
      }

      default:
      // Unhandled event type
    }
  } catch (error) {
    // Error handling webhook
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("Webhook processed", { status: 200 });
}

// Handler functions
async function handleAccountUpdated(account: Stripe.Account) {
  // Account updated

  // Find and update seller profile with account status
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { stripeAccountId: account.id },
  });

  if (sellerProfile) {
    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        stripeAccountStatus: account.charges_enabled ? "active" : "pending",
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
        stripeRequirements: account.requirements as any,
        stripeCapabilities: account.capabilities as any,
        stripeOnboardingComplete:
          account.charges_enabled &&
          account.payouts_enabled &&
          account.details_submitted,
      },
    });
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  // Payment succeeded

  // Update order status
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "CAPTURED",
        status: "CONFIRMED",
      },
    });

    // Get buyer profile to get userId
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { id: order.buyerProfileId },
    });

    if (buyerProfile) {
      // Create transaction record
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          userId: buyerProfile.userId,
          type: "PURCHASE",
          amount: order.total,
          status: "COMPLETED",
          paymentMethod: "STRIPE",
          stripeTransactionId: paymentIntent.id,
          stripeFeeAmount: 0, // Will be updated when we get the charge details
          netAmount: order.total,
        },
      });
    }

    // TODO: Send confirmation email
    // TODO: Notify seller of new order
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Payment failed

  // Update order status
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "FAILED",
        status: "CANCELLED",
      },
    });
  }
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  // Charge succeeded

  // Update order with charge ID if needed
  if (charge.payment_intent && typeof charge.payment_intent === "string") {
    await prisma.order.updateMany({
      where: { stripePaymentIntentId: charge.payment_intent },
      data: { stripeChargeId: charge.id },
    });
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  // Customer created

  // Update user with Stripe customer ID
  if (customer.email) {
    await prisma.user.update({
      where: { email: customer.email },
      data: { stripeCustomerId: customer.id },
    });
  }
}
