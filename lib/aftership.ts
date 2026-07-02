// EasyPost Tracker API — free tier, no upgrade required
// Docs: https://www.easypost.com/docs/api#trackers
const EASYPOST_API_URL = "https://api.easypost.com/v2";

// EasyPost statuses where the carrier has physically accepted the package
const IN_TRANSIT_STATUSES = new Set([
  "in_transit",
  "out_for_delivery",
  "delivered",
  "available_for_pickup",
]);

export type TrackingResult = {
  tag: string | null;
  carrierConfirmed: boolean;
};

export async function createOrGetTracking(
  trackingNumber: string,
  carrier: string,
): Promise<TrackingResult> {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    // No API key configured — save tracking without verification
    return { tag: null, carrierConfirmed: false };
  }

  // EasyPost uses HTTP Basic Auth: API key as username, empty password
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const res = await fetch(`${EASYPOST_API_URL}/trackers`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tracker: {
        tracking_code: trackingNumber,
        carrier,
      },
    }),
  });

  if (!res.ok) {
    return { tag: null, carrierConfirmed: false };
  }

  const data = await res.json();
  const tag: string | null = data?.status ?? null;
  return { tag, carrierConfirmed: tag ? IN_TRANSIT_STATUSES.has(tag) : false };
}
