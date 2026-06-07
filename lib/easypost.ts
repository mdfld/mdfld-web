const EASYPOST_API_URL = "https://api.easypost.com/v2";

export type RateOption = {
  easypostRateId: string
  carrier: string
  service: string
  rateCents: number
  totalCents: number
  deliveryDays: number | null
}

export type ShippingRatesResult = {
  standard: RateOption
  express: RateOption | null
}

export async function getShippingRates(params: {
  fromAddress: { street: string; city: string; state: string; zip: string; country: string }
  toAddress:   { street: string; city: string; state: string; zip: string; country: string }
  parcel:      { weightOz: number; length: number; width: number; height: number }
  markupPct:   number
}): Promise<ShippingRatesResult> {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) throw new Error("EASYPOST_API_KEY is not set");

  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const res = await fetch(`${EASYPOST_API_URL}/shipments`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      shipment: {
        from_address: {
          street1: params.fromAddress.street,
          city:    params.fromAddress.city,
          state:   params.fromAddress.state,
          zip:     params.fromAddress.zip,
          country: params.fromAddress.country,
        },
        to_address: {
          street1: params.toAddress.street,
          city:    params.toAddress.city,
          state:   params.toAddress.state,
          zip:     params.toAddress.zip,
          country: params.toAddress.country,
        },
        parcel: {
          weight: params.parcel.weightOz,
          length: params.parcel.length,
          width:  params.parcel.width,
          height: params.parcel.height,
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`EasyPost API error: ${res.status}`);

  const data = await res.json();
  const rates: any[] = data.rates ?? [];

  const withCents = rates.map((r) => ({
    easypostRateId: r.id as string,
    carrier:        r.carrier as string,
    service:        r.service as string,
    rateCents:      Math.round(parseFloat(r.rate) * 100),
    totalCents:     Math.ceil(Math.round(parseFloat(r.rate) * 100) * (1 + params.markupPct)),
    deliveryDays:   r.delivery_days as number | null,
  }));

  const byCost = [...withCents].sort((a, b) => a.rateCents - b.rateCents);
  const standard = byCost[0];

  const bySpeed = [...withCents].sort((a, b) => {
    if (a.deliveryDays == null) return 1;
    if (b.deliveryDays == null) return -1;
    return a.deliveryDays - b.deliveryDays;
  });
  const fastest = bySpeed[0];

  const express =
    fastest.easypostRateId !== standard.easypostRateId ? fastest : null;

  return { standard, express };
}

export { createOrGetTracking } from "./aftership";
