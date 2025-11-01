"use client";

import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Image,
  Chip,
  Divider,
  Link,
  Tab,
  Tabs,
  Tooltip,
  User,
  Spinner,
  Pagination,
} from "@heroui/react";

import { JoinDate } from "@/components/dashboard/settings/join-date";
import { useSession } from "@/lib/auth-client";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    displayUsername: string | null;
    image: string | null;
    bio: string | null;
    website: string | null;
    location: string | null;
    banner: string | null;
    isVerifiedSeller: boolean;
    trustScore: number;
    createdAt: Date;
    _count: {
      followers: number;
      following: number;
    };
    sellerProfile?: {
      storeName: string;
      storeDescription: string | null;
      averageRating: number;
      totalSales: number;
      isActive: boolean;
    } | null;
  };
}

interface Follower {
  id: string;
  name: string;
  username: string;
  displayUsername: string | null;
  image: string | null;
  bio: string | null;
  isVerifiedSeller: boolean;
  _count: {
    followers: number;
    following: number;
  };
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
}

export function UserProfileContent({ user }: UserProfileProps) {
  const { data: session } = useSession();
  const isOwnProfile = session?.user?.id === user.id;
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(user._count.followers);
  const [isLoading, setIsLoading] = useState(false);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [followersPagination, setFollowersPagination] =
    useState<PaginationInfo | null>(null);
  const [followersPage, setFollowersPage] = useState(1);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);
  const [followingPagination, setFollowingPagination] =
    useState<PaginationInfo | null>(null);
  const [followingPage, setFollowingPage] = useState(1);

  const formatTrustScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  const formatLocation = (location: string) => {
    return location
      .split(",")
      .map((part) => part.trim())
      .join(", ");
  };

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!session?.user?.id || isOwnProfile) return;

      try {
        const response = await fetch(`/api/users/${user.username}/follow`);
        if (response.ok) {
          const data = await response.json();
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        // Error checking follow status
      }
    };

    checkFollowStatus();
  }, [session?.user?.id, user.username, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to follow users");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${user.username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setFollowCount(isFollowing ? followCount - 1 : followCount + 1);
        toast.success(isFollowing ? "Unfollowed" : "Following");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update follow status");
      }
    } catch (error) {
      // Error toggling follow
      toast.error("Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowers = async (page: number = 1) => {
    setIsLoadingFollowers(true);
    try {
      const response = await fetch(
        `/api/users/${user.username}/followers?page=${page}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setFollowers(data.followers);
        } else {
          setFollowers([...followers, ...data.followers]);
        }
        setFollowersPagination(data.pagination);
        setFollowersPage(page);
      }
    } catch (error) {
      // Error fetching followers
      toast.error("Failed to load followers");
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const fetchFollowing = async (page: number = 1) => {
    setIsLoadingFollowing(true);
    try {
      const response = await fetch(
        `/api/users/${user.username}/following?page=${page}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setFollowing(data.following);
        } else {
          setFollowing([...following, ...data.following]);
        }
        setFollowingPagination(data.pagination);
        setFollowingPage(page);
      }
    } catch (error) {
      // Error fetching following
      toast.error("Failed to load following");
    } finally {
      setIsLoadingFollowing(false);
    }
  };

  return (
    <>
      {/* Full Width Banner */}
      <div className="relative w-full h-80 md:h-96 lg:h-[28rem] -mt-8">
        {user.banner ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${user.banner})` }}
          >
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/80 to-transparent" />
          </div>
        )}

        {/* Glassmorphic User Info Bar with Avatar */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="backdrop-blur-xl bg-white/10 dark:bg-black/50 border-white/20 overflow-visible shadow-[0_-4px_16px_rgba(0,0,0,0.4)]">
            <div className="container mx-auto px-4 max-w-6xl overflow-visible">
              <div className="flex items-start py-4 overflow-visible gap-8">
                {/* Avatar - Now in same container with overlap */}
                <div className="relative -mt-12 shrink-0">
                  <Avatar
                    src={user.image || undefined}
                    name={user.displayUsername || user.name}
                    className="w-32 h-32 border-2 border-primary shadow-2xl"
                    radius="full"
                  />
                  {/* Active/Online Indicator */}
                  {isOwnProfile && (
                    <div className="absolute bottom-1 right-4">
                      <div className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col">
                    <h1 className="text-xl md:text-3xl font-normal tracking-widest capitalize text-white drop-shadow-lg">
                      {user.displayUsername || user.name}
                    </h1>
                    <p className="text-white/80 text-sm drop-shadow">
                      @{user.username}
                    </p>
                  </div>
                  <div className="flex py-2 gap-4">
                    <div className="flex gap-2 items-center">
                      <Icon icon="fluent-mdl2:group"></Icon>
                      <Divider orientation="vertical"></Divider>

                      <p className="text-sm">{followCount} Followers</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Icon icon="iconamoon:profile-thin"></Icon>
                      <Divider orientation="vertical"></Divider>

                      <p className="text-sm">
                        {user._count.following} Following
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Icon icon="codicon:location"></Icon>
                      <Divider orientation="vertical"></Divider>

                      <p className="text-sm">{user.location}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Icon icon="game-icons:new-born"></Icon>
                      <Divider orientation="vertical"></Divider>

                      <JoinDate
                        className="items-center"
                        createdAt={user.createdAt}
                      ></JoinDate>
                    </div>
                  </div>
                </div>

                {/* Stats and Badges */}
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <div className="hidden md:flex gap-3 text-sm text-white/90">
                    <Tooltip
                      content="You can't follow yourself"
                      placement="top"
                      showArrow
                      isDisabled={!isOwnProfile}
                    >
                      <div>
                        <Button
                          radius="full"
                          className="px-10 text-xs tracking-tight"
                          color={isFollowing ? "default" : "primary"}
                          onClick={handleFollowToggle}
                          isLoading={isLoading}
                          isDisabled={isOwnProfile}
                        >
                          {isFollowing ? "Unfollow" : "Follow"}
                        </Button>
                      </div>
                    </Tooltip>
                    <Divider orientation="vertical"></Divider>
                    <Tooltip
                      content="You can't message yourself"
                      placement="top"
                      showArrow
                      isDisabled={!isOwnProfile}
                    >
                      <div>
                        <Button
                          radius="full"
                          className="px-10 text-xs tracking-tight"
                          color="default"
                          isDisabled={isOwnProfile}
                        >
                          Message
                        </Button>
                      </div>
                    </Tooltip>
                  </div>

                  {/* Trust Score Badge */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Description Bar */}
      <div className="flex justify-center w-full backdrop-blur-lg bg-white/5 dark:bg-black/5 border-b border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
        <div className="flex justify-center px-4 max-w-6xl">
          <div className="py-6 flex items-center justify-center gap-4">
            {/* Avatar placeholder space */}
            {/* Description text */}
            <div className="flex-1 mx-34">
              <p className="text-default-600 text-center dark:text-default-400">
                {user.bio}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="relative">
        <div className="flex flex-col w-full relative z-10">
          <Tabs
            aria-label="Options"
            classNames={{
              tabList:
                "gap-20 relative px-0 w-screen rounded-none p-0 border-b border-divider",
              cursor: "w-full",
              tab: "max-w-fit px-0 h-12",
              tabContent: "capitalize px-10 tracking-widest",
            }}
            color="primary"
            variant="underlined"
            onSelectionChange={(key) => {
              if (
                key === "followers" &&
                followers.length === 0 &&
                !isLoadingFollowers
              ) {
                fetchFollowers(1);
              } else if (
                key === "following" &&
                following.length === 0 &&
                !isLoadingFollowing
              ) {
                fetchFollowing(1);
              }
            }}
          >
            <Tab key="Stores" title={`Stores`}>
              <div className="p-8">
                <Card>
                  <CardBody className="p-6">
                    <p className="text-default-600">
                      Stores list coming soon...
                    </p>
                  </CardBody>
                </Card>
              </div>
            </Tab>
            <Tab key="followers" title={`Followers`}>
              <div className="p-8">
                <Card>
                  <CardBody className="p-6">
                    {isLoadingFollowers && followersPage === 1 ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                      </div>
                    ) : followers.length === 0 ? (
                      <p className="text-default-600 text-center py-8">
                        No followers yet
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {followers.map((follower) => (
                          <div
                            key={follower.id}
                            className="flex items-center justify-between p-3 hover:bg-default-100 rounded-lg transition-colors"
                          >
                            <User
                              name={follower.displayUsername || follower.name}
                              description={`@${follower.username} • ${follower._count.followers} followers`}
                              avatarProps={{
                                src: follower.image || undefined,
                                size: "md",
                              }}
                            />
                            <div className="flex items-center gap-2">
                              {follower.isVerifiedSeller && (
                                <Chip color="success" size="sm" variant="flat">
                                  Verified Seller
                                </Chip>
                              )}
                              <Button
                                as={Link}
                                href={`/users/${follower.username}`}
                                size="sm"
                                variant="light"
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        ))}
                        {followersPagination &&
                          followersPagination.totalPages > 1 && (
                            <div className="flex justify-center mt-4">
                              <Pagination
                                total={followersPagination.totalPages}
                                page={followersPage}
                                onChange={(page) => fetchFollowers(page)}
                                showControls
                                color="primary"
                                variant="bordered"
                              />
                            </div>
                          )}
                        {isLoadingFollowers && followersPage > 1 && (
                          <div className="flex justify-center py-4">
                            <Spinner size="md" />
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </Tab>
            <Tab key="following" title={`Following`}>
              <div className="p-8">
                <Card>
                  <CardBody className="p-6">
                    {isLoadingFollowing && followingPage === 1 ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                      </div>
                    ) : following.length === 0 ? (
                      <p className="text-default-600 text-center py-8">
                        Not following anyone yet
                      </p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {following.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 hover:bg-default-100 rounded-lg transition-colors"
                          >
                            <User
                              name={user.displayUsername || user.name}
                              description={`@${user.username} • ${user._count.followers} followers`}
                              avatarProps={{
                                src: user.image || undefined,
                                size: "md",
                              }}
                            />
                            <div className="flex items-center gap-2">
                              {user.isVerifiedSeller && (
                                <Chip color="success" size="sm" variant="flat">
                                  Verified Seller
                                </Chip>
                              )}
                              <Button
                                as={Link}
                                href={`/users/${user.username}`}
                                size="sm"
                                variant="light"
                              >
                                View Profile
                              </Button>
                            </div>
                          </div>
                        ))}
                        {followingPagination &&
                          followingPagination.totalPages > 1 && (
                            <div className="flex justify-center mt-4">
                              <Pagination
                                total={followingPagination.totalPages}
                                page={followingPage}
                                onChange={(page) => fetchFollowing(page)}
                                showControls
                                color="primary"
                                variant="bordered"
                              />
                            </div>
                          )}
                        {isLoadingFollowing && followingPage > 1 && (
                          <div className="flex justify-center py-4">
                            <Spinner size="md" />
                          </div>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
}
