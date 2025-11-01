import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, calculateApplicationFee } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { buyerProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create customer if doesn't exist
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Group items by seller
    const itemsBySeller = items.reduce((acc: any, item: any) => {
      if (!acc[item.sellerId]) {
        acc[item.sellerId] = [];
      }
      acc[item.sellerId].push(item);
      return acc;
    }, {});

    // Get seller profiles with Stripe account info
    const sellerIds = Object.keys(itemsBySeller);
    const sellers = await prisma.sellerProfile.findMany({
      where: { id: { in: sellerIds } },
      select: {
        id: true,
        stripeAccountId: true,
        commissionRate: true,
        storeName: true,
      },
    });

    // Create line items and payment intent data for each seller
    const lineItems: any[] = [];
    const metadata: any = {
      userId: session.user.id,
      itemCount: items.length.toString(),
    };

    for (const seller of sellers) {
      const sellerItems = itemsBySeller[seller.id];

      for (const item of sellerItems) {
        const unitAmount = Math.round(Number(item.price) * 100); // Convert to cents
        const applicationFeeAmount = calculateApplicationFee(
          unitAmount * item.quantity,
        );

        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
              images: item.image ? [item.image] : [],
              metadata: {
                productId: item.productId,
                variantId: item.variantId || "",
                sellerId: seller.id,
              },
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });

        // Add metadata for order creation
        metadata[`item_${item.productId}`] = JSON.stringify({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
          sellerId: seller.id,
          applicationFee: applicationFeeAmount / 100, // Convert back to dollars
        });
      }
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/bag`,
      metadata,
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"],
      },
      billing_address_collection: "required",
      payment_intent_data: {
        metadata,
      },
      phone_number_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    // Failed to create checkout session
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
