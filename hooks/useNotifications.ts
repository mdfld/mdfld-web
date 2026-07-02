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

    let ws: WebSocket | null = null;
    let cancelled = false;

    const connect = async () => {
      // The websocket server requires a short-lived token issued to the
      // authenticated session; the notification stream is bound to it.
      const res = await fetch("/api/ws-token?type=notifications");
      if (!res.ok || cancelled) return;
      const { token } = await res.json();
      if (cancelled) return;

      const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
      ws = new WebSocket(
        `${wsBase}/notifications/${session.user.id}?token=${encodeURIComponent(token)}`,
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
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(notification.title || "New notification", {
              body: notification.content,
              icon: "/icon.png",
            });
          }
        }
      };
    };

    connect();

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, [session?.user?.id, utils]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);
}
