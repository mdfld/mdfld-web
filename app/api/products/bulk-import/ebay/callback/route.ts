import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createId } from "@paralleldrive/cuid2";

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("import_oauth_state")?.value;
  cookieStore.delete("import_oauth_state");

  if (!state || !savedState || state !== savedState) {
    return NextResponse.json({ error: "Invalid state. Possible CSRF attack." }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!sellerProfile) {
    return NextResponse.json({ error: "No seller profile" }, { status: 403 });
  }

  // Exchange code for tokens
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString("base64");

  const tokenRes = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.EBAY_REDIRECT_URI!,
    }).toString(),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_token_failed`, request.url)
    );
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.sellerProfile.update({
    where: { id: sellerProfile.id },
    data: {
      ebayAccessToken: tokens.access_token,
      ebayRefreshToken: tokens.refresh_token,
      ebayTokenExpiresAt: expiresAt,
    },
  });

  // Fetch listings from eBay Sell Inventory API
  const listingsRes = await fetch(
    "https://api.ebay.com/sell/inventory/v1/inventory_item?limit=200",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  );

  if (!listingsRes.ok) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_fetch_failed`, request.url)
    );
  }

  const { inventoryItems } = await listingsRes.json();

  const { normaliseCategory } = await import("@/lib/import/normalise-category");
  const { normaliseCondition } = await import("@/lib/import/normalise-condition");
  const { normaliseSize } = await import("@/lib/import/normalise-size");

  const rows = (inventoryItems ?? []).map((item: any) => {
    const product = item.product ?? {};
    const category = normaliseCategory(item.groupType ?? "");
    const rawSize = product.aspects?.Size?.[0] ?? "";
    const size = normaliseSize(rawSize);

    return {
      id: createId(),
      title: product.title ?? "Untitled",
      description: product.description || product.title || "Untitled",
      price: 0, // eBay inventory API doesn't include price; seller sets it
      category,
      condition: normaliseCondition(item.condition ?? ""),
      brand: product.brand,
      sku: item.sku,
      inventory: item.availability?.shipToLocationAvailability?.quantity ?? 0,
      images: (product.imageUrls ?? []).slice(0, 8),
      tags: [],
      hasVariants: false,
      sizeValue: size?.sizeValue,
      sizeSystem: size?.sizeSystem ?? (rawSize ? null : undefined),
      sizeDisplay: size?.sizeDisplay,
      status: !category ? "skip" : size === null && rawSize ? "fix_size" : "ready",
      sourcePlatform: "ebay",
      sourceThumbnail: product.imageUrls?.[0],
    };
  });

  const importSession = await prisma.importSession.create({
    data: {
      sellerId: sellerProfile.id,
      platform: "ebay",
      rows,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return NextResponse.redirect(
    new URL(`/dashboard/organization/import?session=${importSession.id}`, request.url)
  );
}
