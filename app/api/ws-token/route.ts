import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signWsToken } from "@/lib/ws-token";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const type = request.nextUrl.searchParams.get("type");
  const userId = session.user.id;

  if (type === "notifications") {
    const token = signWsToken(
      { userId, channel: `notifications:${userId}` },
      secret,
    );
    return NextResponse.json({ token });
  }

  if (type === "chat") {
    const conversationId = request.nextUrl.searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this conversation" },
        { status: 403 },
      );
    }
    const token = signWsToken(
      { userId, channel: `chat:${conversationId}` },
      secret,
    );
    return NextResponse.json({ token });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
