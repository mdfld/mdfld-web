"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

export function useNotificationSubscription() {
  const utils = trpc.useUtils();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const ws = new WebSocket(
      `ws://localhost:3001/notifications/${session.user.id}`,
    );

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "NEW_NOTIFICATION") {
        // Invalidate notification queries to refetch
        utils.notification.list.invalidate();
        utils.notification.unreadCount.invalidate();

        // Show toast notification
        const notification = data.notification;
        toast(notification.title || "New notification", {
          description: notification.content,
          action: notification.metadata?.conversationId
            ? {
                label: "View",
                onClick: () => {
                  window.location.href = `/dashboard/inbox?conversation=${notification.metadata.conversationId}`;
                },
              }
            : undefined,
        });

        // Show browser notification if permission granted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(notification.title || "New notification", {
            body: notification.content,
            icon: "/icon.png",
          });
        }
      }
    };

    return () => {
      ws.close();
    };
  }, [session?.user?.id, utils]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
}
