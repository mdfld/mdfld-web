import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return new Response(JSON.stringify({ userCount }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    // Prisma user count error
    return new Response(
      JSON.stringify({ error: "Error fetching user count" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
