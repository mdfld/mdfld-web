export async function sendPaypalPayout(params: {
  paypalEmail:  string;
  amountUsd:    string;
  senderItemId: string;
}): Promise<{ payoutBatchId: string }> {
  const clientId     = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const apiUrl       = process.env.PAYPAL_API_URL ?? "https://api-m.paypal.com";

  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch(`${apiUrl}/v1/oauth2/token`, {
    method:  "POST",
    headers: {
      Authorization:  `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) throw new Error(`PayPal OAuth failed: ${tokenRes.status}`);

  const { access_token } = await tokenRes.json();

  const payoutRes = await fetch(`${apiUrl}/v1/payments/payouts`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender_batch_header: {
        email_subject: "You have a payout from MDFLD",
        email_message: "Your MDFLD earnings have been sent.",
      },
      items: [
        {
          recipient_type: "EMAIL",
          amount:         { value: params.amountUsd, currency: "USD" },
          receiver:       params.paypalEmail,
          sender_item_id: params.senderItemId,
        },
      ],
    }),
  });

  if (!payoutRes.ok) throw new Error(`PayPal payout failed: ${payoutRes.status}`);

  const data = await payoutRes.json();
  return { payoutBatchId: data.batch_header.payout_batch_id };
}
