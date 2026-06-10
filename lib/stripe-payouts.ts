import { stripe } from "@/lib/stripe";

export async function transferToSeller(params: {
  stripeAccountId: string;
  amountCents:     number;
  reference:       string;
  idempotencyKey?: string;
}): Promise<{ transferId: string }> {
  try {
    const transferParams = {
      amount:         params.amountCents,
      currency:       "usd",
      destination:    params.stripeAccountId,
      transfer_group: params.reference,
    };
    const transfer = params.idempotencyKey
      ? await stripe.transfers.create(transferParams, { idempotencyKey: params.idempotencyKey })
      : await stripe.transfers.create(transferParams);
    return { transferId: transfer.id };
  } catch (err: any) {
    throw new Error(`Stripe transfer failed: ${err?.message ?? "unknown error"}`);
  }
}
