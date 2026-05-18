import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const APP_BASE = process.env.NEXT_PUBLIC_BASE_URL!;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", APP_BASE));
  }

  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop");

  if (!shop || !/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) {
    return NextResponse.redirect(
      new URL("/dashboard/organization/import?error=invalid_shop", APP_BASE)
    );
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, role: "owner" },
    select: { organizationId: true },
  });

  if (!membership) {
    return NextResponse.redirect(
      new URL("/dashboard/organization/import?error=no_organization", APP_BASE)
    );
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_CLIENT_ID!,
    scope: "read_products",
    redirect_uri: process.env.SHOPIFY_REDIRECT_URI!,
    state,
  });

  const response = NextResponse.redirect(
    `https://${shop}/admin/oauth/authorize?${params.toString()}`
  );
  response.cookies.set("import_oauth_state_shopify", JSON.stringify({ state, shop }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  response.cookies.set("import_shopify_org_id", membership.organizationId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
