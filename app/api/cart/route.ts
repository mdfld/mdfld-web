import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ items: [], itemCount: 0, subtotal: 0 });
    }

    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!buyerProfile) {
      return NextResponse.json({ items: [], itemCount: 0, subtotal: 0 });
    }

    const items = await prisma.cartItem.findMany({
      where: { buyerProfileId: buyerProfile.id },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            inventory: true,
          },
        },
        variant: true,
      },
    });

    const itemCount = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum: number, item: { quantity: number; variant: { price: unknown } | null; product: { price: unknown } }) => {
      const price = item.variant?.price ?? item.product.price;
      return sum + Number(price) * item.quantity;
    }, 0);

    return NextResponse.json({ items, itemCount, subtotal });
  } catch {
    return NextResponse.json({ items: [], itemCount: 0, subtotal: 0 });
  }
}