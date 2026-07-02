import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role;
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    return NextResponse.json({ isAdmin });
  } catch {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }
}
