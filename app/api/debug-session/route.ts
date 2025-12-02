import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const sessionToken =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  let session = null;
  if (sessionToken) {
    try {
      const sessionData = await auth.api.getSession({
        headers: request.headers,
      });
      session = sessionData;
    } catch (error) {
      console.error("Session fetch error:", error);
    }
  }

  return NextResponse.json({
    cookies: {
      "better-auth.session_token":
        request.cookies.get("better-auth.session_token")?.value || null,
      "__Secure-better-auth.session_token":
        request.cookies.get("__Secure-better-auth.session_token")?.value ||
        null,
      allCookies: Object.fromEntries(
        request.cookies.getAll().map((c) => [c.name, c.value]),
      ),
    },
    session,
    headers: {
      cookie: request.headers.get("cookie"),
      host: request.headers.get("host"),
      origin: request.headers.get("origin"),
    },
  });
}
