import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { createId } from "@paralleldrive/cuid2";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("import_oauth_state")?.value;
  cookieStore.delete("import_oauth_state");

  if (!state || !savedState || state !== savedState) {
    return NextResponse.json({ error: "Invalid state. Possible CSRF attack." }, { status: 400 });
  }

  if (!code || !shop) {
    return NextResponse.json({ error: "Missing code or shop" }, { status: 400 });
  }

  // Exchange code for token
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

  const { access_token } = await tokenRes.json();

  // Store token on SellerProfile
  const sellerProfile = await prisma.sellerProfile.findUnique({
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
    },
  });

  // Fetch products from Shopify
  const productsRes = await fetch(
    `https://${shop}/admin/api/2024-01/products.json?limit=250`,
    { headers: { "X-Shopify-Access-Token": access_token } }
  );

  if (!productsRes.ok) {
    return NextResponse.redirect(
      new URL(`/dashboard/organization/import?error=shopify_fetch_failed`, request.url)
    );
  }

  const { products } = await productsRes.json();

  const { normaliseCategory } = await import("@/lib/import/normalise-category");
  const { normaliseCondition } = await import("@/lib/import/normalise-condition");
  const { normaliseSize } = await import("@/lib/import/normalise-size");

  const rows = products.flatMap((product: any) =>
    product.variants.map((variant: any) => {
      const category = normaliseCategory(product.product_type || "");
      const size = normaliseSize(variant.title !== "Default Title" ? variant.title : "");
      return {
        id: createId(),
        title: product.title,
        description: product.body_html?.replace(/<[^>]+>/g, "") || product.title,
        price: parseFloat(variant.price),
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
  const importSession = await prisma.importSession.create({
    data: {
      sellerId: sellerProfile.id,
      platform: "shopify",
      rows,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return NextResponse.redirect(
    new URL(`/dashboard/organization/import?session=${importSession.id}`, request.url)
  );
}
