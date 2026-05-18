import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const ENDPOINT_URL = "https://mdfld.co/api/ebay/account-deletion";

// eBay sends a GET with challenge_code — we prove ownership by hashing it
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challengeCode = searchParams.get("challenge_code");

  if (!challengeCode) {
    return NextResponse.json({ error: "Missing challenge_code" }, { status: 400 });
  }

  const verificationToken = process.env.EBAY_VERIFICATION_TOKEN;
  if (!verificationToken) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const challengeResponse = createHash("sha256")
    .update(challengeCode + verificationToken + ENDPOINT_URL)
    .digest("hex");

  return NextResponse.json({ challengeResponse });
}

// eBay notifies us when one of their users deletes their account
export async function POST(request: NextRequest) {
  // Acknowledge immediately — eBay requires a 200 within a few seconds
  return new NextResponse(null, { status: 200 });
}
