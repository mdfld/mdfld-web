import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { normaliseCategory } from "@/lib/import/normalise-category";
import { normaliseCondition } from "@/lib/import/normalise-condition";
import { normaliseSize } from "@/lib/import/normalise-size";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");

  if (!shop || !/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=invalid_shop`, request.url)
    );
  }

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("import_oauth_state_shopify")?.value;
  cookieStore.delete("import_oauth_state_shopify");

  let savedState: string;
  let savedShop: string;
  try {
    const parsed = JSON.parse(rawCookie ?? "");
    savedState = parsed.state;
    savedShop = parsed.shop;
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=invalid_state`, request.url)
    );
  }

  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=invalid_state`, request.url)
    );
  }

  if (shop !== savedShop) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=invalid_state`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=missing_params`, request.url)
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Exchange code for token
  let access_token: string;
  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json({ error: "Failed to exchange token" }, { status: 502 });
    }

    const body = await tokenRes.json();
    access_token = body.access_token;
  } catch {
    return NextResponse.json({ error: "Failed to reach Shopify token endpoint" }, { status: 502 });
  }

  // Store token on SellerProfile
  let sellerProfile: { id: string } | null;
  try {
    sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!sellerProfile) {
      return NextResponse.json({ error: "No seller profile" }, { status: 403 });
    }

    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        shopifyAccessToken: access_token,
        shopifyShopDomain: shop,
        shopifyTokenExpiresAt: null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Database error saving token" }, { status: 500 });
  }

  // Fetch products from Shopify
  let products: any[];
  try {
    const productsRes = await fetch(
      `https://${shop}/admin/api/2024-01/products.json?limit=250`,
      { headers: { "X-Shopify-Access-Token": access_token } }
    );

    if (!productsRes.ok) {
      return NextResponse.redirect(
        new URL(`/dashboard/organization/import?error=shopify_fetch_failed`, request.url)
      );
    }

    const body = await productsRes.json();
    products = body.products;
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=shopify_fetch_failed`, request.url)
    );
  }

  const rows = products.flatMap((product: any) =>
    product.variants.map((variant: any) => {
      const category = normaliseCategory(product.product_type || "");
      const size = normaliseSize(variant.title !== "Default Title" ? variant.title : "");
      return {
        id: createId(),
        title: product.title,
        description: product.body_html?.replace(/<[^>]+>/g, "") || product.title,
        price: Number.isFinite(parseFloat(variant.price)) ? parseFloat(variant.price) : 0,
        category,
        condition: normaliseCondition(""),
        brand: product.vendor,
        sku: variant.sku || undefined,
        inventory: variant.inventory_quantity ?? 0,
        images: product.images.map((i: any) => i.src),
        tags: product.tags ? product.tags.split(",").map((t: string) => t.trim()) : [],
        hasVariants: product.variants.length > 1,
        sizeValue: size?.sizeValue,
        sizeSystem: size?.sizeSystem ?? null,
        sizeDisplay: size?.sizeDisplay,
        status: !category ? "skip" : size === null && variant.title !== "Default Title" ? "fix_size" : "ready",
        sourcePlatform: "shopify",
        sourceThumbnail: product.images[0]?.src,
      };
    })
  );

  // Store in ImportSession
  let importSession: { id: string };
  try {
    importSession = await prisma.importSession.create({
      data: {
        sellerId: sellerProfile.id,
        platform: "shopify",
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
