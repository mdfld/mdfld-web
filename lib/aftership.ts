const AFTERSHIP_API_URL = "https://api.aftership.com/v4";

const CARRIER_SLUGS: Record<string, string> = {
  UPS: "ups",
  USPS: "usps",
  FedEx: "fedex",
  DHL: "dhl-express",
};

// Tags where the carrier has physically accepted the package
const IN_TRANSIT_TAGS = new Set([
  "InTransit",
  "OutForDelivery",
  "AttemptFail",
  "Delivered",
  "AvailableForPickup",
]);

export type TrackingResult = {
  tag: string | null;
  carrierConfirmed: boolean;
};

export async function createOrGetTracking(
  trackingNumber: string,
  carrier: string,
): Promise<TrackingResult> {
  const apiKey = process.env.AFTERSHIP_API_KEY;
  if (!apiKey) {
    // No API key configured — save tracking without verification
    return { tag: null, carrierConfirmed: false };
  }

  const slug = CARRIER_SLUGS[carrier] ?? null;

  const body: Record<string, unknown> = { tracking_number: trackingNumber };
  if (slug) body.slug = slug;

  // Try to create the tracking
  let res = await fetch(`${AFTERSHIP_API_URL}/trackings`, {
    method: "POST",
    headers: {
      "aftership-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tracking: body }),
  });

  let data = await res.json();

  // 409 = tracking already exists, fetch it instead
  if (res.status === 409 && slug) {
    res = await fetch(
      `${AFTERSHIP_API_URL}/trackings/${slug}/${trackingNumber}`,
      { headers: { "aftership-api-key": apiKey } },
    );
    data = await res.json();
  }

  const tag: string | null = data?.data?.tracking?.tag ?? null;
  return { tag, carrierConfirmed: tag ? IN_TRANSIT_TAGS.has(tag) : false };
}
