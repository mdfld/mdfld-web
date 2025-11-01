import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await context.params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        displayUsername: true,
        image: true,
        bio: true,
        website: true,
        location: true,
        banner: true,
        isVerifiedSeller: true,
        trustScore: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
        sellerProfile: {
          select: {
            storeName: true,
            storeDescription: true,
            averageRating: true,
            totalSales: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    // Error fetching user
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
