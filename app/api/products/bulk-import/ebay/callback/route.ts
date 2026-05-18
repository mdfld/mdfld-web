import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { normaliseCategory } from "@/lib/import/normalise-category";
import { normaliseCondition } from "@/lib/import/normalise-condition";
import { normaliseSize } from "@/lib/import/normalise-size";

const EBAY_TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const APP_BASE = process.env.NEXT_PUBLIC_BASE_URL!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("import_oauth_state_ebay")?.value;
  cookieStore.delete("import_oauth_state_ebay");

  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=invalid_state`, APP_BASE)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=missing_params`, APP_BASE)
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", APP_BASE));
  }

  const orgId = cookieStore.get("import_ebay_org_id")?.value;
  cookieStore.delete("import_ebay_org_id");

  if (!orgId) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=no_organization`, APP_BASE)
    );
  }

  let sellerProfile: { id: string } | null;
  try {
    sellerProfile = await prisma.sellerProfile.findUnique({
      where: { organizationId: orgId },
    });
    if (!sellerProfile) {
      return NextResponse.redirect(
        new URL(`/dashboard/organization/import?error=no_seller_profile`, APP_BASE)
      );
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
        new URL(`/dashboard/organization/import?error=ebay_token_failed`, APP_BASE)
      );
    }

    tokens = await tokenRes.json();
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_token_failed`, APP_BASE)
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

  const authHeader = { Authorization: `Bearer ${tokens.access_token}` };

  // Fetch inventory items and offers in parallel
  // Offers carry price and listing status — best-effort, don't fail if unavailable
  let inventoryItems: any[];
  let offersBySku: Record<string, any> = {};

  try {
    const [itemsRes, offersRes] = await Promise.all([
      fetch("https://api.ebay.com/sell/inventory/v1/inventory_item?limit=200", { headers: authHeader }),
      fetch("https://api.ebay.com/sell/inventory/v1/offer?limit=200", { headers: authHeader }),
    ]);

    if (!itemsRes.ok) {
      const errCode = itemsRes.status === 403 ? "ebay_not_seller" : "ebay_fetch_failed";
      return NextResponse.redirect(
        new URL(`/dashboard/organization/import?error=${errCode}`, APP_BASE)
      );
    }

    const itemsBody = await itemsRes.json();
    inventoryItems = itemsBody.inventoryItems ?? [];

    if (offersRes.ok) {
      const offersBody = await offersRes.json();
      for (const offer of (offersBody.offers ?? [])) {
        if (offer.sku && !offersBySku[offer.sku]) {
          offersBySku[offer.sku] = offer;
        }
      }
    }
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_fetch_failed`, APP_BASE)
    );
  }

  if (!inventoryItems || inventoryItems.length === 0) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=ebay_no_listings`, APP_BASE)
    );
  }

  const rows = inventoryItems.map((item: any) => {
    const product = item.product ?? {};
    const offer = offersBySku[item.sku];

    // Keyword-match on title — most reliable for football gear
    const category = normaliseCategory(product.title ?? "");

    // eBay stores size in product aspects; check both common keys
    const rawSize =
      product.aspects?.Size?.[0] ??
      product.aspects?.["Shoe Size"]?.[0] ??
      product.aspects?.["UK Shoe Size"]?.[0] ??
      "";
    const size = normaliseSize(rawSize);

    // Price from offer if available; seller will set it on MDFLD otherwise
    const price = offer?.pricingSummary?.price?.value
      ? parseFloat(offer.pricingSummary.price.value)
      : 0;

    // Brand from product field or aspects
    const brand = product.brand ?? product.aspects?.Brand?.[0] ?? null;

    return {
      id: createId(),
      title: product.title ?? "Untitled",
      description: product.description || product.title || "Untitled",
      price,
      category,
      condition: normaliseCondition(item.condition ?? ""),
      brand,
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
    new URL(`/dashboard/organization/import?session=${importSession.id}`, APP_BASE)
  );
}
