import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email",
    "/",
    "/about",
    "/contact",
    "/products",
    "/shop",
    "/api/auth",
    "/api/uploadthing",
    "/api/debug-session",
  ];

  // Check if the current path is a public route or API route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isApiRoute = pathname.startsWith("/api");
  const isStaticAsset = pathname.startsWith("/_next") || pathname.includes(".");

  // Allow access to public routes, API routes, and static assets
  if (isPublicRoute || isApiRoute || isStaticAsset) {
    return NextResponse.next();
  }

  // For protected routes, check if user has a session cookie
  // Better Auth uses __Secure- prefix for HTTPS connections
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  if (!sessionCookie) {
    // Redirect to login if no session
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  if (pathname.startsWith("/admin")) {
    // TODO: Implement role-based access control
    // For now, all authenticated users can access admin area
    // In production, check if user has admin role/permissions
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
