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

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
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
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [], itemCount: 0, subtotal: 0 });
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.variant?.price ?? item.product.price;
      return sum + Number(price) * item.quantity;
    }, 0);

    return NextResponse.json({ items: cart.items, itemCount, subtotal });
  } catch {
    return NextResponse.json({ items: [], itemCount: 0, subtotal: 0 });
  }
}