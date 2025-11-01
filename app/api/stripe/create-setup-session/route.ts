import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId, returnUrl } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 },
      );
    }

    // Create a Stripe Checkout session for adding payment methods
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${returnUrl}?setup=success`,
      cancel_url: `${returnUrl}?setup=cancelled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    // Failed to create setup session
    return NextResponse.json(
      { error: "Failed to create setup session" },
      { status: 500 },
    );
  }
}
