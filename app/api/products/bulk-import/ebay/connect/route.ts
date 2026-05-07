import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EBAY_SCOPE = "https://api.ebay.com/oauth/api_scope/sell.inventory.readonly";
const EBAY_AUTH_URL = "https://auth.ebay.com/oauth2/authorize";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_BASE_URL));
  }

  // Find the user's organization so the callback can locate the right sellerProfile
  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, role: "owner" },
    select: { organizationId: true },
  });

  if (!membership) {
    return NextResponse.redirect(
      new URL("/dashboard/organization/import?error=no_organization", process.env.NEXT_PUBLIC_BASE_URL)
    );
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: process.env.EBAY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.EBAY_REDIRECT_URI!,
    scope: EBAY_SCOPE,
    state,
  });

  const response = NextResponse.redirect(`${EBAY_AUTH_URL}?${params.toString()}`);
  response.cookies.set("import_oauth_state_ebay", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  response.cookies.set("import_ebay_org_id", membership.organizationId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
