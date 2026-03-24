import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing session id" }, { status: 400 });
  }

  const importSession = await prisma.importSession.findUnique({ where: { id } });

  if (!importSession) {
    return NextResponse.json({ error: "Session not found or expired" }, { status: 404 });
  }

  if (new Date() > importSession.expiresAt) {
    await prisma.importSession.delete({ where: { id } });
    return NextResponse.json({ error: "Session expired" }, { status: 410 });
  }

  return NextResponse.json({ rows: importSession.rows, platform: importSession.platform });
}
