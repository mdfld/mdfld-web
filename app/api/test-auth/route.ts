import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  try {
    // Test sign in
    const response = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: request.headers,
    });

    // Check if session was created
    const sessions = await prisma.session.findMany({
      where: {
        user: {
          email,
        },
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      authResponse: response,
      sessionsInDb: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        token: s.token,
        expiresAt: s.expiresAt,
        userId: s.userId,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        stack: error.stack,
      },
      { status: 400 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCount = await prisma.session.count();
    const userCount = await prisma.user.count();

    return NextResponse.json({
      sessionCount,
      userCount,
      testUser: await prisma.user.findFirst({
        where: { email: "test@example.com" },
        select: {
          id: true,
          email: true,
          emailVerified: true,
        },
      }),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }
}
