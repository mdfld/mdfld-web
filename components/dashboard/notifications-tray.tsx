"use client";

import type { CardProps } from "@heroui/react";

import React from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Tabs,
  Tab,
  ScrollShadow,
  CardFooter,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { formatDistanceToNow } from "date-fns";

import NotificationItem from "./notification-item";

type Notification = {
  id: string;
  isRead?: boolean;
  avatar: string;
  description: string;
  name: string;
  time: string;
  type?: "default" | "request" | "file";
};

enum NotificationTabs {
  All = "all",
  Unread = "unread",
}

export default function NotificationsTray(props: CardProps) {
  const [activeTab, setActiveTab] = React.useState<NotificationTabs>(
    NotificationTabs.All,
  );
  const utils = trpc.useUtils();

  // Fetch notifications
  const { data, isLoading } = (trpc as any).notification.list.useQuery({
    filter: activeTab === "unread" ? "unread" : "all",
    limit: 50,
  });

  // Mutations
  const markAsReadMutation = (trpc as any).notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = (
    trpc as any
  ).notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Map database notifications to UI format
  const notifications: Notification[] = React.useMemo(() => {
    if (!data?.notifications) return [];

    return (data.notifications as any[]).map((n: any) => {
      // Parse metadata for additional info like sender details
      const metadata = n.metadata as any;

      return {
        id: n.id,
        isRead: n.isRead,
        avatar:
          metadata?.senderImage ||
          metadata?.avatar ||
          `https://i.pravatar.cc/150?u=${n.id}`,
        description: n.content,
        name: metadata?.senderName || n.title,
        time: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
        type:
          n.type === "NEW_MESSAGE"
            ? "default"
            : n.type === "ORDER_UPDATE"
              ? "file"
              : n.type === "FRAUD_ALERT"
                ? "request"
                : "default",
      };
    });
  }, [data]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Card className="w-full max-w-[420px]" {...props}>
      <CardHeader className="flex flex-col px-0 pb-0">
        <div className="flex w-full items-center justify-between px-5 py-2">
          <div className="inline-flex items-center gap-1">
            <h4 className="text-large inline-block align-middle font-medium">
              Notifications
            </h4>
            <Chip size="sm" variant="flat">
              {notifications.length}
            </Chip>
          </div>
          <Button
            className="h-8 px-3"
            color="primary"
            radius="full"
            variant="light"
            onClick={handleMarkAllAsRead}
            isDisabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
        <Tabs
          aria-label="Notifications"
          classNames={{
            base: "w-full",
            tabList:
              "gap-6 px-6 py-0 w-full relative rounded-none border-b border-divider",
            cursor: "w-full",
            tab: "max-w-fit px-2 h-12",
          }}
          color="primary"
          selectedKey={activeTab}
          variant="underlined"
          onSelectionChange={(selected) =>
            setActiveTab(selected as NotificationTabs)
          }
        >
          <Tab
            key="all"
            title={
              <div className="flex items-center space-x-2">
                <span>All</span>
                <Chip size="sm" variant="flat">
                  {notifications.length}
                </Chip>
              </div>
            }
          />
          <Tab
            key="unread"
            title={
              <div className="flex items-center space-x-2">
                <span>Unread</span>
                <Chip size="sm" variant="flat">
                  {unreadCount}
                </Chip>
              </div>
            }
          />
        </Tabs>
      </CardHeader>
      <CardBody className="w-full gap-0 p-0">
        <ScrollShadow className="h-[500px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => {
              const metadata = (data?.notifications as any[])?.find(
                (n: any) => n.id === notification.id,
              )?.metadata as any;

              return (
                <div
                  key={notification.id}
                  className="cursor-pointer"
                  onClick={() => {
                    handleMarkAsRead(notification.id);
                    // Navigate to conversation if it's a message notification
                    if (metadata?.conversationId) {
                      window.location.href = `/dashboard/inbox?conversation=${metadata.conversationId}`;
                    }
                  }}
                >
                  <NotificationItem {...notification} />
                </div>
              );
            })
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2">
              <Icon
                className="text-default-400"
                icon="solar:bell-off-linear"
                width={40}
              />
              <p className="text-small text-default-400">
                No notifications yet.
              </p>
            </div>
          )}
        </ScrollShadow>
      </CardBody>
      <CardFooter className="justify-end gap-2 px-4">
        <Button variant="light">Settings</Button>
      </CardFooter>
    </Card>
  );
}

export { NotificationsTray };
