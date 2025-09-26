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
    "/api/auth",
    "/api/uploadthing",
  ];

  // Check if the current path is a public route or API route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isApiAuthRoute = pathname.startsWith("/api/auth");

  // Allow access to public routes and auth API routes
  if (isPublicRoute || isApiAuthRoute) {
    return NextResponse.next();
  }

  // For protected routes, check if user has a session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token");

  if (!sessionCookie) {
    // Redirect to login if no session
    return NextResponse.redirect(new URL("/auth/login", request.url));
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
