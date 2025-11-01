import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: session.user.id },
      select: { wishlist: true },
    });

    if (!buyerProfile || !buyerProfile.wishlist.length) {
      return NextResponse.json({ items: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: buyerProfile.wishlist },
      },
      select: {
        id: true,
        title: true,
        price: true,
        compareAtPrice: true,
        images: true,
        category: true,
        condition: true,
        isActive: true,
        inventory: true,
        seller: {
          select: {
            storeName: true,
            user: {
              select: { name: true },
            },
            organization: {
              select: { name: true },
            },
          },
        },
      },
    });

    const items = products.map((product) => ({
      id: product.id,
      title: product.title,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice
        ? Number(product.compareAtPrice)
        : undefined,
      image: product.images[0] || "/placeholder-product.jpg",
      category: product.category,
      condition: product.condition,
      sellerName:
        product.seller.organization?.name ||
        product.seller.user?.name ||
        product.seller.storeName,
      isActive: product.isActive,
      inventory: product.inventory,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    // Failed to fetch wishlist
    return NextResponse.json(
      { error: "Failed to fetch wishlist items" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 },
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get or create buyer profile
    let buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!buyerProfile) {
      buyerProfile = await prisma.buyerProfile.create({
        data: {
          userId: session.user.id,
          wishlist: [productId],
          preferredCategories: [],
        },
      });
    } else {
      // Add to wishlist if not already present
      if (!buyerProfile.wishlist.includes(productId)) {
        await prisma.buyerProfile.update({
          where: { id: buyerProfile.id },
          data: {
            wishlist: {
              push: productId,
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Failed to add to wishlist
    return NextResponse.json(
      { error: "Failed to add item to wishlist" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 },
      );
    }

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
