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

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
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

// ─── MAIN: Create orders from Stripe checkout session ────────────────────────
async function handleCheckoutSessionCompleted(
  checkoutSession: Stripe.Checkout.Session,
) {
  console.log("[Webhook] checkout.session.completed:", checkoutSession.id);

  const metadata = checkoutSession.metadata || {};
  const userId = metadata.userId;

  if (!userId) {
    console.error("[Webhook] No userId in checkout session metadata");
    return;
  }

  // Idempotency: if order already exists for this session, skip
  const existingOrder = await prisma.order.findFirst({
    where: { stripePaymentIntentId: checkoutSession.payment_intent as string },
  });
  if (existingOrder) {
    console.log("[Webhook] Order already exists, skipping:", existingOrder.id);
    return;
  }

  // Get buyer profile
  const buyerProfile = await prisma.buyerProfile.findUnique({
    where: { userId },
  });
  if (!buyerProfile) {
    console.error("[Webhook] BuyerProfile not found for userId:", userId);
    return;
  }

  // Parse items from metadata (set by create-checkout-session)
  const itemEntries = Object.entries(metadata).filter(([key]) =>
    key.startsWith("item_"),
  );

  if (itemEntries.length === 0) {
    console.error("[Webhook] No items found in metadata");
    return;
  }

  // Group items by seller
  const itemsBySeller: Record<
    string,
    Array<{
      productId: string;
      variantId?: string;
      quantity: number;
      price: number;
      sellerId: string;
      applicationFee: number;
    }>
  > = {};

  for (const [, value] of itemEntries) {
    try {
      const item = JSON.parse(value as string);
      if (!itemsBySeller[item.sellerId]) {
        itemsBySeller[item.sellerId] = [];
      }
      itemsBySeller[item.sellerId].push(item);
    } catch (e) {
      console.error("[Webhook] Failed to parse item metadata:", e);
    }
  }

  // Extract address data from Stripe session (type assertion for Stripe v19)
  const sessionAny = checkoutSession as any;
  const shippingDetails = sessionAny.shipping_details ?? sessionAny.collected_information?.shipping_details ?? null;
  const customerDetails = (checkoutSession.customer_details ?? null) as any;

  const shippingAddress = shippingDetails?.address
    ? {
        line1: shippingDetails.address.line1 || "",
        line2: shippingDetails.address.line2 || "",
        city: shippingDetails.address.city || "",
        state: shippingDetails.address.state || "",
        postalCode: shippingDetails.address.postal_code || "",
        country: shippingDetails.address.country || "",
        name: shippingDetails.name || "",
      }
    : { line1: "", city: "", country: "", name: "" };

  const billingAddress = customerDetails?.address
    ? {
        line1: customerDetails.address.line1 || "",
        line2: customerDetails.address.line2 || "",
        city: customerDetails.address.city || "",
        state: customerDetails.address.state || "",
        postalCode: customerDetails.address.postal_code || "",
        country: customerDetails.address.country || "",
        name: customerDetails.name || "",
      }
    : shippingAddress;

  const amountTotal = checkoutSession.amount_total || 0;
  const paymentIntentId = checkoutSession.payment_intent as string;

  // Create one Order per seller
  const createdOrderIds: string[] = [];

  for (const [sellerId, items] of Object.entries(itemsBySeller)) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
    });

    if (!sellerProfile) {
      console.error("[Webhook] SellerProfile not found:", sellerId);
      continue;
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const total = subtotal; // tax/shipping handled by Stripe

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerProfileId: buyerProfile.id,
        sellerProfileId: sellerProfile.id,
        status: "CONFIRMED",
        paymentMethod: "STRIPE",
        paymentStatus: "CAPTURED",
        subtotal,
        tax: 0,
        shipping: 0,
        total: amountTotal / 100, // Stripe sends cents
        stripePaymentIntentId: paymentIntentId,
        shippingAddress,
        billingAddress,
        items: {
          create: await Promise.all(
            items.map(async (item) => {
              // Get variant details for size/color snapshot
              let sizeDisplay: string | undefined;
              let color: string | undefined;
              if (item.variantId) {
                const variant = await prisma.productVariant.findUnique({
                  where: { id: item.variantId },
                  select: { sizeDisplay: true, color: true },
                });
                sizeDisplay = variant?.sizeDisplay ?? undefined;
                color = variant?.color ?? undefined;
              }
              return {
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                price: item.price,
                sizeDisplay,
                color,
              };
            }),
          ),
        },
      },
    });

    createdOrderIds.push(order.id);
    console.log("[Webhook] Order created:", order.id, "for seller:", sellerId);
  }

  // ── Clear buyer's cart after orders created ───────────────────────────────
  if (createdOrderIds.length > 0) {
    const deleted = await prisma.cartItem.deleteMany({
      where: { buyerProfileId: buyerProfile.id },
    });
    console.log("[Webhook] Cart cleared:", deleted.count, "items removed for buyer:", buyerProfile.id);

    // Update buyer stats
    await prisma.buyerProfile.update({
      where: { id: buyerProfile.id },
      data: {
        totalOrders: { increment: createdOrderIds.length },
      },
    });
  }
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

async function handleAccountUpdated(account: Stripe.Account) {
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

async function handleCustomerCreated(customer: Stripe.Customer) {
  if (customer.email) {
    await prisma.user.updateMany({
      where: { email: customer.email },
      data: { stripeCustomerId: customer.id },
    });
  }
}