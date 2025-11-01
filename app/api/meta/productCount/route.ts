import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const productCount = await prisma.product.count();
    return new Response(JSON.stringify({ productCount }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    // Prisma product count error
    return new Response(
      JSON.stringify({ error: "Error fetching product count" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
