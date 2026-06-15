import { NextRequest } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { handleCheckoutSessionCompleted } from "@/lib/checkout-webhook";

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
    console.error("[Webhook] Signature verification failed:", err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(checkoutSession);
        break;
      }

      case "account.application.authorized":
        break;

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

      case "transfer.created":
      case "payout.created":
        break;

      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(customer);
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("[Webhook] Handler error:", error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("Webhook processed", { status: 200 });
}

// ─── Update order status when payment_intent.succeeded fires ─────────────────
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
) {
  const orders = await prisma.order.findMany({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "CAPTURED", status: "CONFIRMED" },
    });

    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { id: order.buyerProfileId },
    });

    if (buyerProfile) {
      // Only create transaction if one doesn't already exist for this payment
      const existing = await prisma.transaction.findFirst({
        where: { stripeTransactionId: paymentIntent.id },
      });
      if (!existing) {
        await prisma.transaction.create({
          data: {
            orderId: order.id,
            userId: buyerProfile.userId,
            type: "PURCHASE",
            amount: order.total,
            status: "COMPLETED",
            paymentMethod: "STRIPE",
            stripeTransactionId: paymentIntent.id,
            stripeFeeAmount: 0,
            netAmount: order.total,
          },
        });
      }
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { paymentStatus: "FAILED", status: "CANCELLED" },
  });
}

async function handleChargeSucceeded(charge: Stripe.Charge) {
  if (charge.payment_intent && typeof charge.payment_intent === "string") {
    await prisma.order.updateMany({
      where: { stripePaymentIntentId: charge.payment_intent },
      data: { stripeChargeId: charge.id },
    });
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  if (customer.email) {
    await prisma.user.updateMany({
      where: { email: customer.email },
      data: { stripeCustomerId: customer.id },
    });
  }
}