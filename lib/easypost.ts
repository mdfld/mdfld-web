const EASYPOST_API_URL = "https://api.easypost.com/v2";

export type BuyLabelResult = {
  shipmentId:     string;
  labelUrl:       string;
  trackingNumber: string;
  carrier:        string;
  rateCents:      number;
};

const FALLBACK_PARCEL: { weightOz: number; length: number; width: number; height: number } = { weightOz: 16, length: 12, width: 10, height: 6 };

export async function buyShippingLabel(params: {
  fromAddress: { street: string; city: string; state: string; zip: string; country: string };
  toAddress:   { name?: string; street: string; city: string; state: string; zip: string; country: string };
  parcel:      { weightOz: number; length: number; width: number; height: number } | null;
  reference:   string;
}): Promise<BuyLabelResult> {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) throw new Error("EASYPOST_API_KEY is not set");

  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

  let parcel = params.parcel;
  if (parcel == null) {
    console.warn(`[EasyPost] buyShippingLabel: null parcel for reference=${params.reference}, using fallback`);
    parcel = FALLBACK_PARCEL;
  }

  const shipRes = await fetch(`${EASYPOST_API_URL}/shipments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      shipment: {
        reference: params.reference,
        from_address: {
          street1: params.fromAddress.street,
          city:    params.fromAddress.city,
          state:   params.fromAddress.state,
          zip:     params.fromAddress.zip,
          country: params.fromAddress.country,
        },
        to_address: {
          name:    params.toAddress.name ?? "",
          street1: params.toAddress.street,
          city:    params.toAddress.city,
          state:   params.toAddress.state,
          zip:     params.toAddress.zip,
          country: params.toAddress.country,
        },
        parcel: {
          weight: parcel.weightOz,
          length: parcel.length,
          width:  parcel.width,
          height: parcel.height,
        },
        options: { label_format: "PDF" },
      },
    }),
  });

  if (!shipRes.ok) throw new Error(`EasyPost API error creating shipment: ${shipRes.status}`);

  const shipData = await shipRes.json();
  const rates: any[] = shipData.rates ?? [];

  if (rates.length === 0) throw new Error("No rates available from EasyPost for this shipment");

  const cheapest = [...rates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0];

  const buyRes = await fetch(`${EASYPOST_API_URL}/shipments/${shipData.id}/buy`, {
    method: "POST",
    headers,
    body: JSON.stringify({ rate: { id: cheapest.id } }),
  });

  if (!buyRes.ok) throw new Error(`EasyPost API error buying label: ${buyRes.status}`);

  const bought = await buyRes.json();

  if (!bought.postage_label?.label_url) {
    throw new Error(`EasyPost label URL missing for shipment ${shipData.id}, label may still be generating`);
  }
  if (!bought.selected_rate?.carrier || !bought.selected_rate?.rate) {
    throw new Error(`EasyPost selected_rate missing for shipment ${shipData.id}`);
  }
  if (!bought.tracking_code) {
    throw new Error(`EasyPost tracking_code missing for shipment ${shipData.id}`);
  }

  return {
    shipmentId:     bought.id,
    labelUrl:       bought.postage_label.label_url,
    trackingNumber: bought.tracking_code,
    carrier:        bought.selected_rate.carrier,
    rateCents:      Math.round(parseFloat(bought.selected_rate.rate) * 100),
  };
}

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
