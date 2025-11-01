"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc-client";
import type { Message, User, MessageStatus } from "@prisma/client";

interface ChatMessage extends Omit<Message, "status"> {
  sender: Pick<User, "id" | "name" | "image" | "username">;
  decryptedContent?: string;
  status: MessageStatus;
}

interface TypingUser {
  userId: string;
  timestamp: number;
}

export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(
    new Map(),
  );
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial messages
  const { data: initialMessages, isLoading } = (
    trpc as any
  ).chat.messages.useQuery(
    {
      conversationId,
      limit: 50,
    },
    {
      enabled: !!conversationId, // Only run query when conversationId exists
    },
  );

  // Send message mutation
  const sendMessageMutation = (trpc as any).chat.sendMessage.useMutation({
    onSuccess: (newMessage: any) => {
      // Optimistically add message to local state
      setMessages((prev) => [...prev, newMessage as ChatMessage]);
    },
  });

  // Mark as read mutation
  const markAsReadMutation = (trpc as any).chat.markAsRead.useMutation();

  // Send typing indicator
  const sendTypingMutation = (trpc as any).chat.sendTyping.useMutation();

  // Initialize messages
  useEffect(() => {
    if (initialMessages?.messages) {
      setMessages(initialMessages.messages as ChatMessage[]);
    }
  }, [initialMessages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return;

    // For now, we'll use a simple WebSocket connection
    // In production, you'd want to use the Redis subscription properly
    const ws = new WebSocket(`ws://localhost:3001/chat/${conversationId}`);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "new_message":
          // Add the new message
          setMessages((prev) => [
            ...prev,
            {
              ...data.message,
              decryptedContent: data.message.content,
            },
          ]);
          break;

        case "typing":
          if (data.isTyping) {
            setTypingUsers((prev) =>
              new Map(prev).set(data.userId, {
                userId: data.userId,
                timestamp: Date.now(),
              }),
            );
          } else {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              next.delete(data.userId);
              return next;
            });
          }
          break;

        case "read_receipt":
          // Update message status
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, status: "READ" as MessageStatus }
                : msg,
            ),
          );
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [conversationId]);

  // Clean up stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const next = new Map(prev);
        for (const [userId, data] of next) {
          if (now - data.timestamp > 3000) {
            next.delete(userId);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!content.trim() && !imageUrl) return;

      const metadata = imageUrl ? { imageUrl } : undefined;

      await sendMessageMutation.mutateAsync({
        conversationId,
        content,
        type: imageUrl ? "IMAGE" : "TEXT",
        metadata,
      });
    },
    [conversationId, sendMessageMutation],
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      sendTypingMutation.mutate({
        conversationId,
        isTyping,
      });

      // Auto-stop typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingMutation.mutate({
            conversationId,
            isTyping: false,
          });
        }, 3000);
      }
    },
    [conversationId, sendTypingMutation],
  );

  const markAsRead = useCallback(
    (messageId: string) => {
      markAsReadMutation.mutate({
        conversationId,
        messageId,
      });
    },
    [conversationId, markAsReadMutation],
  );

  return {
    messages,
    isLoading,
    isConnected,
    typingUsers: Array.from(typingUsers.values()),
    sendMessage,
    sendTypingIndicator,
    markAsRead,
  };
}

// Hook for conversation list
export function useConversations() {
  const { data: conversations, isLoading } = (
    trpc as any
  ).chat.conversations.useQuery();

  const createConversationMutation = (
    trpc as any
  ).chat.createConversation.useMutation();

  const createConversation = useCallback(
    async (participantIds: string[], type: "DIRECT" | "GROUP" = "DIRECT") => {
      return await createConversationMutation.mutateAsync({
        participantIds,
        type,
      });
    },
    [createConversationMutation],
  );

  return {
    conversations: conversations || [],
    isLoading,
    createConversation,
  };
}

// Hook for user presence
export function usePresence() {
  const updatePresenceMutation = (
    trpc as any
  ).chat.updatePresence.useMutation();

  useEffect(() => {
    // Set online on mount
    updatePresenceMutation.mutate({ status: "online" });

    // Set offline on unmount
    return () => {
      updatePresenceMutation.mutate({ status: "offline" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  // Handle page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      updatePresenceMutation.mutate({
        status: document.hidden ? "offline" : "online",
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only set up listener once
}
