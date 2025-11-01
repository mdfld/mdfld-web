import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const ITEMS_PER_PAGE = 10;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const { username } = await params;
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get total count for pagination
    const totalCount = await prisma.follow.count({
      where: { followerId: user.id },
    });

    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            displayUsername: true,
            image: true,
            bio: true,
            isVerifiedSeller: true,
            _count: {
              select: {
                followers: true,
                following: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    });

    const followingList = following.map((follow) => follow.following);

    return NextResponse.json({
      following: followingList,
      pagination: {
        page,
        totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
        totalCount,
        hasMore: skip + ITEMS_PER_PAGE < totalCount,
      },
    });
  } catch (error) {
    // Error fetching following
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 },
    );
  }
}
