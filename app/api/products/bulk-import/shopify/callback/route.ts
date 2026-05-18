import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createId } from "@paralleldrive/cuid2";
import { normaliseCategory } from "@/lib/import/normalise-category";
import { normaliseCondition } from "@/lib/import/normalise-condition";
import { normaliseSize } from "@/lib/import/normalise-size";

const APP_BASE = process.env.NEXT_PUBLIC_BASE_URL!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");

  if (!shop || !/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=invalid_shop`, APP_BASE)
    );
  }

  const cookieStore = await cookies();
  const rawCookie = cookieStore.get("import_oauth_state_shopify")?.value;
  const orgId = cookieStore.get("import_shopify_org_id")?.value;
  cookieStore.delete("import_oauth_state_shopify");
  cookieStore.delete("import_shopify_org_id");

  let savedState: string;
  let savedShop: string;
  try {
    const parsed = JSON.parse(rawCookie ?? "");
    savedState = parsed.state;
    savedShop = parsed.shop;
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=invalid_state`, APP_BASE)
    );
  }

  if (!state || !savedState || state !== savedState || shop !== savedShop) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=invalid_state`, APP_BASE)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=missing_params`, APP_BASE)
    );
  }

  if (!orgId) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=no_organization`, APP_BASE)
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", APP_BASE));
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
      return NextResponse.redirect(
        new URL(`/dashboard/organization/import?error=shopify_token_failed`, APP_BASE)
      );
    }

    const body = await tokenRes.json();
    access_token = body.access_token;
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=shopify_token_failed`, APP_BASE)
    );
  }

  // Look up sellerProfile by organizationId
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

    await prisma.sellerProfile.update({
      where: { id: sellerProfile.id },
      data: {
        shopifyAccessToken: access_token,
        shopifyShopDomain: shop,
        shopifyTokenExpiresAt: null,
      },
    });
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=shopify_token_failed`, APP_BASE)
    );
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
        new URL(`/dashboard/organization/import?error=shopify_fetch_failed`, APP_BASE)
      );
    }

    const body = await productsRes.json();
    products = body.products;
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=shopify_fetch_failed`, APP_BASE)
    );
  }

  if (!products || products.length === 0) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=shopify_no_products`, APP_BASE)
    );
  }

  const rows = products.flatMap((product: any) =>
    product.variants.map((variant: any) => {
      const category = normaliseCategory(product.product_type || product.title || "");
      const size = normaliseSize(variant.title !== "Default Title" ? variant.title : "");
      return {
        id: createId(),
        title: product.title,
        description: product.body_html?.replace(/<[^>]+>/g, "") || product.title,
        price: Number.isFinite(parseFloat(variant.price)) ? parseFloat(variant.price) : 0,
        category,
        condition: normaliseCondition(""),
        brand: product.vendor || null,
        sku: variant.sku || undefined,
        inventory: variant.inventory_quantity ?? 0,
        images: product.images.map((i: any) => i.src),
        tags: product.tags ? product.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        hasVariants: product.variants.length > 1,
        sizeValue: size?.sizeValue,
        sizeSystem: size?.sizeSystem ?? (variant.title !== "Default Title" ? null : undefined),
        sizeDisplay: size?.sizeDisplay,
        status: !category ? "skip" : size === null && variant.title !== "Default Title" ? "fix_size" : "ready",
        sourcePlatform: "shopify",
        sourceThumbnail: product.images[0]?.src,
      };
    })
  );

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
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=shopify_fetch_failed`, APP_BASE)
    );
  }

  return NextResponse.redirect(
    new URL(`/dashboard/organization/import?session=${importSession.id}`, APP_BASE)
  );
}
