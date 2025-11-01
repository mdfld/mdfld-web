import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 },
      );
    }

    // Get buyer profile
    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!buyerProfile) {
      return NextResponse.json(
        { error: "Buyer profile not found" },
        { status: 404 },
      );
    }

    // Remove from wishlist
    const updatedWishlist = buyerProfile.wishlist.filter(
      (id) => id !== productId,
    );

    await prisma.buyerProfile.update({
      where: { id: buyerProfile.id },
      data: {
        wishlist: updatedWishlist,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Failed to remove from wishlist
    return NextResponse.json(
      { error: "Failed to remove item from wishlist" },
      { status: 500 },
    );
  }
}
