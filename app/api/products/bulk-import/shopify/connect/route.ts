import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const shop = searchParams.get("shop"); // e.g. mystore.myshopify.com
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("import_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_CLIENT_ID!,
    scope: "read_products",
    redirect_uri: process.env.SHOPIFY_REDIRECT_URI!,
    state,
  });

  return NextResponse.redirect(
    `https://${shop}/admin/oauth/authorize?${params.toString()}`
  );
}
