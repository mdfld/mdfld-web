"use client";

import React from "react";
import {
  Button,
  ScrollShadow,
  Spacer,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Badge,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@heroui/react";
import Image from "next/image";
import Sidebar from "./sidebar";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { useNotificationSubscription } from "@/hooks/useNotifications";

import { sectionItems } from "./sidebar-items";
import UserSwitcher from "@/components/dashboard/user-switcher";
import NotificationsTray from "@/components/dashboard/notifications-tray";

/**
 *  This example requires installing the `usehooks-ts` package:
 * `npm install usehooks-ts`
 *
 * import {useMediaQuery} from "usehooks-ts";
 *
 * 💡 TIP: You can use the usePathname hook from Next.js App Router to get the current pathname
 * and use it as the active key for the Sidebar component.
 *
 * ```tsx
 * import {usePathname} from "next/navigation";
 *
 * const pathname = usePathname();
 * const currentPath = pathname.split("/")?.[1]
 *
 * <Sidebar defaultSelectedKey="home" selectedKeys={[currentPath]} />
 * ```
 */
// Helper function to find the active key based on current path
const findActiveKey = (items: any[], pathname: string): string => {
  for (const item of items) {
    // Check if current item matches
    if (item.href && pathname === item.href) {
      return item.key;
    }

    // Check nested items
    if (item.items && item.items.length > 0) {
      const nestedMatch = findActiveKey(item.items, pathname);
      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  // Fallback logic for partial matches
  for (const item of items) {
    if (item.href && item.href !== "#" && pathname.startsWith(item.href)) {
      return item.key;
    }

    if (item.items && item.items.length > 0) {
      const nestedMatch = findActiveKey(item.items, pathname);
      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return "home"; // Default fallback
};

export default function SidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isCompact = useMediaQuery("(max-width: 768px)");
  const pathname = usePathname();
  const router = useRouter();
  const { isPending } = useSession();

  // Get user organizations
  const { data: organizations, isLoading: isLoadingOrgs } =
    trpc.organization.getMyOrganizations.useQuery();

  // Get unread notification count
  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(
    undefined,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  // Subscribe to real-time notification updates
  useNotificationSubscription();

  // Filter sidebar items based on whether user has organizations
  const filteredSectionItems = React.useMemo(() => {
    console.log("Organizations data:", organizations);
    console.log("Loading orgs:", isLoadingOrgs);

    // Don't filter while still loading
    if (isLoadingOrgs) {
      return sectionItems;
    }

    if (!organizations || organizations.length === 0) {
      // Remove the organization section if user has no organizations
      console.log("Filtering out organization section - no orgs found");
      return sectionItems.filter((section) => section.key !== "organization");
    }
    console.log("Keeping all sections - user has organizations");
    return sectionItems;
  }, [organizations, isLoadingOrgs]);

  // Find the active key based on current pathname
  const activeKey = React.useMemo(() => {
    return findActiveKey(filteredSectionItems, pathname);
  }, [filteredSectionItems, pathname]);

  // Handle navigation
  const handleSelect = React.useCallback(
    (key: string) => {
      const findItemByKey = (items: any[], targetKey: string): any => {
        for (const item of items) {
          if (item.key === targetKey) {
            return item;
          }
          if (item.items && item.items.length > 0) {
            const found = findItemByKey(item.items, targetKey);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedItem = findItemByKey(filteredSectionItems, key);
      if (selectedItem?.href && selectedItem.href !== "#") {
        router.push(selectedItem.href);
      }
    },
    [router, filteredSectionItems],
  );

  if (isPending) return null;

  return (
    <div className="flex h-full w-full">
      <div
        className={cn(
          "border-r-small! border-divider transition-width relative flex h-full w-72 flex-col p-6",
          {
            "w-16 items-center px-2 py-6": isCompact,
          },
        )}
      >
        <div className="text-background justify-center rounded-full">
          <Image
            src="https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjlsYla8wKE2TjwSU8x3apY10zR5NV9ighPDtr"
            alt="mdfld logo"
            width={100}
            height={10}
            className="flex bg-transparent"
          ></Image>
        </div>
        <Spacer y={8} />
        <div
          className={cn(
            "flex items-center",
            isCompact ? "flex-col gap-4" : "justify-between gap-2",
          )}
        >
          <UserSwitcher isCompact={isCompact} />
          <Popover placement="bottom-start">
            <PopoverTrigger>
              <Button
                isIconOnly
                variant="light"
                className="text-default-500"
                aria-label="Notifications"
              >
                {unreadCount && unreadCount > 0 ? (
                  <Badge
                    color="danger"
                    content={unreadCount}
                    size="sm"
                    placement="top-right"
                  >
                    <Icon icon="solar:bell-bold" width={24} />
                  </Badge>
                ) : (
                  <Icon icon="solar:bell-bold" width={24} />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <NotificationsTray />
            </PopoverContent>
          </Popover>
        </div>
        <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
          <Sidebar
            defaultSelectedKey={activeKey}
            selectedKeys={[activeKey]}
            isCompact={isCompact}
            items={filteredSectionItems}
            onSelect={handleSelect}
          />
        </ScrollShadow>
        <Spacer y={2} />
        <div
          className={cn("mt-auto flex flex-col", {
            "items-center": isCompact,
          })}
        >
          <Tooltip
            content="Admin Access"
            isDisabled={!isCompact}
            placement="right"
          >
            <Button
              fullWidth
              className={cn(
                "text-default-600 data-[hover=true]:text-foreground justify-start truncate text-sm font-medium antialiased",
                {
                  "justify-center": isCompact,
                },
              )}
              isIconOnly={isCompact}
              startContent={
                isCompact ? null : (
                  <Icon
                    className="text-default-600 flex-none"
                    icon="solar:info-circle-line-duotone"
                    width={24}
                  />
                )
              }
              variant="light"
              onPress={() => router.push("/admin")}
            >
              {isCompact ? (
                <Icon
                  className="text-default-600"
                  icon="solar:info-circle-line-duotone"
                  width={24}
                />
              ) : (
                "Admin Access"
              )}
            </Button>
          </Tooltip>
          <Tooltip
            content="Help & Feedback"
            isDisabled={!isCompact}
            placement="right"
          >
            <Button
              fullWidth
              className={cn(
                "text-default-600 data-[hover=true]:text-foreground justify-start truncate text-sm font-medium antialiased",
                {
                  "justify-center": isCompact,
                },
              )}
              isIconOnly={isCompact}
              startContent={
                isCompact ? null : (
                  <Icon
                    className="text-default-600 flex-none"
                    icon="solar:info-circle-line-duotone"
                    width={24}
                  />
                )
              }
              variant="light"
            >
              {isCompact ? (
                <Icon
                  className="text-default-600"
                  icon="solar:info-circle-line-duotone"
                  width={24}
                />
              ) : (
                "Help & Information"
              )}
            </Button>
          </Tooltip>
          <Tooltip content="Log Out" isDisabled={!isCompact} placement="right">
            <Button
              className={cn(
                "text-default-600 data-[hover=true]:text-foreground justify-start text-sm font-medium antialiased",
                {
                  "justify-center": isCompact,
                },
              )}
              isIconOnly={isCompact}
              startContent={
                isCompact ? null : (
                  <Icon
                    className="text-default-500 flex-none rotate-180"
                    icon="solar:minus-circle-line-duotone"
                    width={24}
                  />
                )
              }
              variant="light"
            >
              {isCompact ? (
                <Icon
                  className="text-default-500 rotate-180"
                  icon="solar:minus-circle-line-duotone"
                  width={24}
                />
              ) : (
                "Log Out"
              )}
            </Button>
          </Tooltip>
        </div>
      </div>
      <div className="w-full flex-1 flex flex-col p-4 overflow-hidden">
        <main className="border-small border-divider flex flex-col rounded-medium h-full w-full overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
