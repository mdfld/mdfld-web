import { stripe } from "@/lib/stripe";

export async function transferToSeller(params: {
  stripeAccountId: string;
  amountCents:     number;
  reference:       string;
}): Promise<{ transferId: string }> {
  try {
    const transfer = await stripe.transfers.create({
      amount:         params.amountCents,
      currency:       "usd",
      destination:    params.stripeAccountId,
      transfer_group: params.reference,
    });
    return { transferId: transfer.id };
  } catch (err: any) {
    throw new Error(`Stripe transfer failed: ${err?.message ?? "unknown error"}`);
  }
}
