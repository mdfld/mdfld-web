import { prisma } from "./prisma";

export async function getUserWithCounts(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    followerCount: user._count.followers,
    followingCount: user._count.following,
  };
}

export async function getUserByUsername(username: string) {
  return await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    include: {
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
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error("Users cannot follow themselves");
  }

  try {
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });
    return follow;
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Already following this user");
    }
    throw error;
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (!follow) {
    throw new Error("Not following this user");
  }

  await prisma.follow.delete({
    where: {
      id: follow.id,
    },
  });

  return true;
}

export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  return !!follow;
}

export async function getFollowers(userId: string, limit = 20, offset = 0) {
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          isVerifiedSeller: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  });

  return followers.map((follow) => follow.follower);
}

export async function getFollowing(userId: string, limit = 20, offset = 0) {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          isVerifiedSeller: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  });

  return following.map((follow) => follow.following);
}

export async function getMutualConnections(userId1: string, userId2: string) {
  const mutualFollowers = await prisma.$queryRaw`
    SELECT u.id, u.name, u.username, u.image, u.bio, u."isVerifiedSeller"
    FROM "user" u
    INNER JOIN "follow" f1 ON u.id = f1."followerId"
    INNER JOIN "follow" f2 ON u.id = f2."followerId"
    WHERE f1."followingId" = ${userId1}
    AND f2."followingId" = ${userId2}
    LIMIT 10
  `;

  return mutualFollowers;
}

export async function getPopularUsers(limit = 10) {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          followers: true,
        },
      },
    },
    orderBy: {
      followers: {
        _count: "desc",
      },
    },
    take: limit,
  });

  return users.map((user) => ({
    ...user,
    followerCount: user._count.followers,
  }));
}
