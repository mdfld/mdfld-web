import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const orgCount = await prisma.organization.count();
    return new Response(JSON.stringify({ orgCount }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    // Prisma org count error
    return new Response(
      JSON.stringify({ error: "Error fetching count count" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
