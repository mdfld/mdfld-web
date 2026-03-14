import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Fetch the Stripe checkout session with all details
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"],
    });

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const paymentIntentId = checkoutSession.payment_intent as string;

    // Idempotency: return existing orders if already fulfilled
    const existingOrders = await prisma.order.findMany({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { items: { include: { product: true } } },
    });

    if (existingOrders.length > 0) {
      return NextResponse.json({ orders: existingOrders, alreadyFulfilled: true });
    }

    // Get buyer profile
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!buyerProfile) {
      return NextResponse.json({ error: "Buyer profile not found" }, { status: 404 });
    }

    // Parse items from metadata
    const metadata = checkoutSession.metadata || {};
    const itemEntries = Object.entries(metadata).filter(([key]) => key.startsWith("item_"));

    if (itemEntries.length === 0) {
      return NextResponse.json({ error: "No items in session metadata" }, { status: 400 });
    }

    // Group by seller
    const itemsBySeller: Record<string, any[]> = {};
    for (const [, value] of itemEntries) {
      const item = JSON.parse(value as string);
      if (!itemsBySeller[item.sellerId]) itemsBySeller[item.sellerId] = [];
      itemsBySeller[item.sellerId].push(item);
    }

    // Build addresses from Stripe session
    const csAny = checkoutSession as any;
    const shipping = csAny.shipping_details ?? csAny.collected_information?.shipping_details ?? null;
    const customer = checkoutSession.customer_details as any;

    const shippingAddress = shipping?.address
      ? {
          name: shipping.name || customer?.name || "",
          line1: shipping.address.line1 || "",
          line2: shipping.address.line2 || "",
          city: shipping.address.city || "",
          state: shipping.address.state || "",
          postalCode: shipping.address.postal_code || "",
          country: shipping.address.country || "",
        }
      : {
          name: customer?.name || "",
          line1: customer?.address?.line1 || "",
          city: customer?.address?.city || "",
          country: customer?.address?.country || "",
        };

    const billingAddress = customer?.address
      ? {
          name: customer.name || "",
          line1: customer.address.line1 || "",
          line2: customer.address.line2 || "",
          city: customer.address.city || "",
          state: customer.address.state || "",
          postalCode: customer.address.postal_code || "",
          country: customer.address.country || "",
        }
      : shippingAddress;

    const amountTotal = (checkoutSession.amount_total || 0) / 100;
    const createdOrders: any[] = [];

    for (const [sellerId, items] of Object.entries(itemsBySeller)) {
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { id: sellerId },
      });

      if (!sellerProfile) {
        console.error("[fulfill-order] SellerProfile not found:", sellerId);
        continue;
      }

      const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const order = await prisma.order.create({
        data: {
          orderNumber,
          buyerProfileId: buyerProfile.id,
          sellerProfileId: sellerProfile.id,
          organizationId: sellerProfile.organizationId ?? null,
          status: "CONFIRMED",
          paymentMethod: "STRIPE",
          paymentStatus: "CAPTURED",
          subtotal,
          tax: 0,
          shipping: 0,
          total: amountTotal,
          stripePaymentIntentId: paymentIntentId,
          shippingAddress,
          billingAddress,
          items: {
            create: await Promise.all(
              items.map(async (item) => {
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
              })
            ),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // Decrement stock for each ordered item
      for (const item of items) {
        try {
          if (item.variantId) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { inventory: { decrement: item.quantity } },
            });
          } else {
            await prisma.product.update({
              where: { id: item.productId },
              data: { inventory: { decrement: item.quantity } },
            });
          }
        } catch (err) {
          console.error("[fulfill-order] Stock decrement failed for item:", item.productId, err);
        }
      }

      createdOrders.push(order);
    }

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { buyerProfileId: buyerProfile.id } });

    // Update buyer stats
    await prisma.buyerProfile.update({
      where: { id: buyerProfile.id },
      data: { totalOrders: { increment: createdOrders.length } },
    });

    return NextResponse.json({ orders: createdOrders, alreadyFulfilled: false });
  } catch (error) {
    console.error("[fulfill-order] Error:", error);
    return NextResponse.json(
      { error: "Failed to fulfill order", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
