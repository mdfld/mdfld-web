import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";
import { handleTradeCashPayment } from "@/lib/trade-webhook";

// ─── MAIN: Create orders from Stripe checkout session ────────────────────────
export async function handleCheckoutSessionCompleted(
  checkoutSession: Stripe.Checkout.Session,
) {

  const metadata = checkoutSession.metadata || {};

  if (metadata.type === "TRADE_CASH_PAYMENT") {
    await handleTradeCashPayment(checkoutSession);
    return;
  }

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

    // Parse per-seller shipping metadata written by create-checkout-session
    const shippingMeta = metadata[`shipping_${sellerId}`]
      ? JSON.parse(metadata[`shipping_${sellerId}`] as string)
      : null;

    const shippingTotal   = shippingMeta ? shippingMeta.totalCents / 100 : 0;
    const shippingRaw     = shippingMeta ? shippingMeta.rateCents  / 100 : 0;
    const shippingMarkup  = shippingTotal - shippingRaw;
    const shippingService = shippingMeta?.service ?? null;

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
        shipping:        shippingTotal,
        shippingMarkup:  shippingMarkup,
        shippingService: shippingService,
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

    // MoR: track seller pending balance (total minus platform commission)
    const commissionRate = sellerProfile.commissionRate ?? 0.10;
    const applicationFeeAmount = subtotal * commissionRate;
    const sellerReceives = subtotal - applicationFeeAmount;

    await Promise.all([
      prisma.sellerProfile.update({
        where: { id: sellerId },
        data: {
          pendingBalance: { increment: sellerReceives },
          lockedBalance: { increment: sellerReceives },
          totalSales: { increment: 1 },
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { applicationFeeAmount },
      }),
      // Decrement inventory for each purchased item
      ...items.map((item) =>
        item.variantId
          ? prisma.productVariant.update({
              where: { id: item.variantId },
              data: { inventory: { decrement: item.quantity } },
            })
          : prisma.product.update({
              where: { id: item.productId },
              data: { inventory: { decrement: item.quantity } },
            }),
      ),
    ]);

    // Mark product inactive if inventory is now 0
    for (const item of items) {
      if (!item.variantId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { inventory: true },
        });
        if (product && product.inventory <= 0) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { isActive: false },
          });
        }
      }
    }
  }

  // ── Clear buyer's cart after orders created ───────────────────────────────
  if (createdOrderIds.length > 0) {
    const deleted = await prisma.cartItem.deleteMany({
      where: { buyerProfileId: buyerProfile.id },
    });

    // Update buyer stats
    await prisma.buyerProfile.update({
      where: { id: buyerProfile.id },
      data: {
        totalOrders: { increment: createdOrderIds.length },
      },
    });
  }
}
