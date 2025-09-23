import { getUserByUsername } from "@/lib/user-utils";
import { notFound } from "next/navigation";
import { UserProfileContent } from "./user-profile-content";

interface UserPageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { username } = await params;

  if (!username) {
    notFound();
  }

  const user = await getUserByUsername(username);

  if (!user) {
    notFound();
  }

  return <UserProfileContent user={user} />;
}

export async function generateMetadata({ params }: UserPageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: "User Not Found",
    };
  }

  return {
    title: `${user.displayUsername || user.name} (@${user.username})`,
    description:
      user.bio ||
      `View ${user.displayUsername || user.name}'s profile on Midfield Co`,
  };
}
