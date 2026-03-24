import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { normaliseCategory } from "@/lib/import/normalise-category";
import { normaliseCondition } from "@/lib/import/normalise-condition";
import { normaliseSize } from "@/lib/import/normalise-size";

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("import_oauth_state_ebay")?.value;
  cookieStore.delete("import_oauth_state_ebay");

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

  let sellerProfile: { id: string } | null;
  try {
    sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!sellerProfile) {
      return NextResponse.json({ error: "No seller profile" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Database error fetching seller profile" }, { status: 500 });
  }

  // Exchange code for tokens
  const credentials = Buffer.from(
    `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
  ).toString("base64");

  let tokens: any;
  try {
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

    tokens = await tokenRes.json();
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_token_failed`, request.url)
    );
  }

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  try {
    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        ebayAccessToken: tokens.access_token,
        ebayRefreshToken: tokens.refresh_token,
        ebayTokenExpiresAt: expiresAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Database error saving token" }, { status: 500 });
  }

  // Fetch listings from eBay Sell Inventory API
  let inventoryItems: any[];
  try {
    const listingsRes = await fetch(
      "https://api.ebay.com/sell/inventory/v1/inventory_item?limit=200",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    if (!listingsRes.ok) {
      return NextResponse.redirect(
        new URL(`/dashboard/organization/import?error=ebay_fetch_failed`, request.url)
      );
    }

    const body = await listingsRes.json();
    inventoryItems = body.inventoryItems;
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_fetch_failed`, request.url)
    );
  }

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
      brand: product.brand ?? null,
      sku: item.sku,
      inventory: item.availability?.shipToLocationAvailability?.quantity ?? 0,
      images: (product.imageUrls ?? []).slice(0, 8),
      tags: [],
      hasVariants: false,
      sizeValue: size?.sizeValue,
      // null = size string present but unrecognised (→ Fix size badge); undefined = no size string
      sizeSystem: size?.sizeSystem ?? (rawSize ? null : undefined),
      sizeDisplay: size?.sizeDisplay,
      status: !category ? "skip" : size === null && rawSize ? "fix_size" : "ready",
      sourcePlatform: "ebay",
      sourceThumbnail: product.imageUrls?.[0],
    };
  });

  let importSession: { id: string };
  try {
    importSession = await prisma.importSession.create({
      data: {
        sellerId: sellerProfile.id,
        platform: "ebay",
        rows,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  } catch {
    return NextResponse.json({ error: "Database error creating import session" }, { status: 500 });
  }

  return NextResponse.redirect(
    new URL(`/dashboard/organization/import?session=${importSession.id}`, request.url)
  );
}
