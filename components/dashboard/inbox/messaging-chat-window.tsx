"use client";

import React, { useEffect, useRef } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";

import MessagingChatMessage from "./messaging-chat-message";
import MessagingChatInput from "./messaging-chat-input";
import MessagingChatHeader from "./messaging-chat-header";
import { useChat } from "@/hooks/useChat";
import { trpc } from "@/lib/trpc-client";

export type MessagingChatWindowProps = React.HTMLAttributes<HTMLDivElement> & {
  paginate?: (page: number) => void;
  toggleMessagingProfileSidebar?: () => void;
};

const MessagingChatWindow = React.forwardRef<
  HTMLDivElement,
  MessagingChatWindowProps
>(({ paginate, toggleMessagingProfileSidebar, ...props }, ref) => {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastReadMessageIdRef = useRef<string | null>(null);
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Use the chat hook
  const {
    messages,
    isLoading,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    typingUsers,
  } = useChat(conversationId || "");

  // Delete message mutation
  const deleteMessageMutation = trpc.chat.deleteMessage.useMutation({
    onSuccess: () => {
      // Refresh messages
      if (conversationId) {
        window.location.reload(); // Simple refresh for now
      }
    },
  });

  // Get conversation details
  const { data: conversations } = trpc.chat.conversations.useQuery(undefined, {
    enabled: !!conversationId,
  });

  // Find the current conversation
  const currentConversation = Array.isArray(conversations)
    ? conversations.find((c) => c.id === conversationId)
    : null;
  const otherParticipants = currentConversation?.participants.filter(
    (p: any) => p.user.id !== currentUserId,
  );
  const displayUser = otherParticipants?.[0]?.user;

  // Reset read tracking when conversation changes
  useEffect(() => {
    lastReadMessageIdRef.current = null;
  }, [conversationId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    if (messages.length > 0 && conversationId && currentUserId) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.senderId !== currentUserId &&
        lastMessage.id !== lastReadMessageIdRef.current
      ) {
        lastReadMessageIdRef.current = lastMessage.id;
        markAsRead(lastMessage.id);
      }
    }
  }, [messages, conversationId, currentUserId, markAsRead]);

  if (!conversationId) {
    return (
      <div ref={ref} {...props}>
        <div className="sm:border-default-200 lg:border-l-small xl:border-r-small w-full flex-col h-full flex items-center justify-center">
          <div className="text-center">
            <Icon
              icon="solar:chat-round-dots-linear"
              width={64}
              className="mx-auto mb-4 text-default-300"
            />
            <p className="text-default-500">
              Select a conversation to start messaging
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} {...props}>
      <div className="sm:border-default-200 lg:border-l-small h-full max-h-[100dvh] lg:max-h-[calc(100vh-30px)] xl:border-r-small w-full flex flex-col">
        <MessagingChatHeader
          className="hidden sm:flex lg:hidden"
          paginate={paginate}
        />
        <div className="border-y-small border-default-200 flex h-17 items-center gap-2 p-3 sm:p-4 lg:border-t-0 flex-shrink-0">
          {/* Back button for mobile and tablet */}
          <Button
            isIconOnly
            className="lg:hidden text-default-500 min-w-8 h-8"
            variant="light"
            onPress={() => paginate?.(-1)}
          >
            <Icon icon="solar:arrow-left-linear" width={20} />
          </Button>
          <div className="w-full">
            <div className="text-small font-semibold">
              {displayUser?.name || "Unknown User"}
            </div>
            <div className="text-small text-default-500 mt-1">
              {typingUsers.length > 0
                ? "Typing..."
                : `@${displayUser?.username || "unknown"}`}
            </div>
          </div>
          <div className="flex-end flex cursor-pointer">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  className="text-default-500 min-w-6"
                  variant="light"
                >
                  <Icon icon="solar:menu-dots-bold" width={24} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                onAction={(key: React.Key) => {
                  if (key === "view_profile") {
                    if (toggleMessagingProfileSidebar) {
                      toggleMessagingProfileSidebar();
                    } else {
                      paginate?.(1);
                    }
                  }
                }}
              >
                <DropdownItem key="view_profile" className="xl:hidden">
                  View Profile
                </DropdownItem>
                <DropdownItem key="mark_as_spam">Mark as spam</DropdownItem>
                <DropdownItem key="delete" className="text-danger">
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollShadow
            ref={scrollRef}
            className="flex flex-col gap-4 px-6 py-4 overflow-y-auto h-full max-h-full"
          >
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Spinner size="lg" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-default-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <MessagingChatMessage
                  key={message.id}
                  messageId={message.id}
                  avatar={message.sender.image || ""}
                  message={
                    message.deletedAt
                      ? "This message has been deleted"
                      : message.decryptedContent || message.content
                  }
                  imageUrl={
                    message.metadata &&
                    typeof message.metadata === "object" &&
                    "imageUrl" in message.metadata
                      ? (message.metadata as any).imageUrl
                      : undefined
                  }
                  name={message.sender.name}
                  time={new Date(message.createdAt).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                  isRTL={message.senderId === currentUserId}
                  canDelete={
                    message.senderId === currentUserId && !message.deletedAt
                  }
                  onDelete={(id) => {
                    deleteMessageMutation.mutate({ messageId: id });
                  }}
                />
              ))
            )}
          </ScrollShadow>
        </div>
        <div className="border-t-small border-default-200 p-4 flex-shrink-0">
          <MessagingChatInput
            onSendMessage={sendMessage}
            onTyping={sendTypingIndicator}
          />
        </div>
      </div>
    </div>
  );
});

MessagingChatWindow.displayName = "MessagingChatWindow";

export default MessagingChatWindow;
