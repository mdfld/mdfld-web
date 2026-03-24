import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";

const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly";
const EBAY_AUTH_URL = "https://auth.ebay.com/oauth2/authorize";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("import_oauth_state_ebay", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: process.env.EBAY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.EBAY_REDIRECT_URI!,
    scope: EBAY_SCOPE,
    state,
  });

  return NextResponse.redirect(`${EBAY_AUTH_URL}?${params.toString()}`);
}
