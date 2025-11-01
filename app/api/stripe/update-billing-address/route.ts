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

    const { customerId, address } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 },
      );
    }

    // Update customer billing address in Stripe
    await stripe.customers.update(customerId, {
      address: {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
      },
    });

    // Successfully updated in Stripe

    return NextResponse.json({ success: true });
  } catch (error) {
    // Failed to update billing address
    return NextResponse.json(
      { error: "Failed to update billing address" },
      { status: 500 },
    );
  }
}
