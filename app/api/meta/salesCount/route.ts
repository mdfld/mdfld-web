import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const salesCount = await prisma.order.count({
      where: {
        status: {
          in: ["DELIVERED", "CONFIRMED", "PROCESSING", "SHIPPED"],
        },
      },
    });
    return new Response(JSON.stringify({ salesCount }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error fetching sales count" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
