import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username } = await params;
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    // Error checking follow status
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username } = await params;
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 },
      );
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 },
      );
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUser.id,
      },
    });

    return NextResponse.json({ success: true, follow });
  } catch (error) {
    // Error following user
    return NextResponse.json(
      { error: "Failed to follow user" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username } = await params;
    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUser.id,
        },
      },
    });

    if (!follow) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 400 },
      );
    }

    await prisma.follow.delete({
      where: {
        id: follow.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error unfollowing user
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 },
    );
  }
}
