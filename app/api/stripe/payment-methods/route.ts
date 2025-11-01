import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 },
      );
    }

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    // Get customer to check default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethod =
      typeof customer !== "string" && !customer.deleted
        ? customer.invoice_settings?.default_payment_method
        : null;

    return NextResponse.json({
      paymentMethods: paymentMethods.data,
      defaultPaymentMethod,
    });
  } catch (error) {
    // Failed to fetch payment methods
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 },
    );
  }
}
