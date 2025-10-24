"use client";

import React from "react";
import {
  Avatar,
  Badge,
  ScrollShadow,
  Listbox,
  ListboxItem,
  Input,
  Tabs,
  Tab,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "@/lib/auth-client";

import MessagingChatHeader from "./messaging-chat-header";

export type MessageChatInboxProps = React.HTMLAttributes<HTMLDivElement> & {
  page?: number;
  paginate?: (direction: number) => void;
  onOpen?: () => void;
};

const MessageChatInbox = React.forwardRef<
  HTMLDivElement,
  MessageChatInboxProps
>(({ page, paginate, onOpen, ...props }, ref) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get("conversation");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("inbox");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // Fetch conversations
  const { data: conversations = [], isLoading } =
    trpc.chat.conversations.useQuery();

  // Filter conversations based on search and tab
  const filteredConversations = React.useMemo(() => {
    if (!conversations || !Array.isArray(conversations) || !currentUserId)
      return [];

    let filtered = conversations;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((conv: any) => {
        const otherParticipants = conv.participants.filter(
          (p: any) => p.user.id !== currentUserId,
        );
        return otherParticipants.some(
          (p: any) =>
            p.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.user.username?.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      });
    }

    // Filter by tab
    if (activeTab === "unread") {
      filtered = filtered.filter((conv: any) => {
        const participant = conv.participants.find(
          (p: any) => p.user.id === currentUserId,
        );
        return participant && participant.unreadCount > 0;
      });
    }

    return filtered;
  }, [conversations, searchQuery, activeTab, currentUserId]);

  const handleConversationClick = (conversationId: string) => {
    router.push(`/dashboard/inbox?conversation=${conversationId}`);
    if (paginate) paginate(1); // For mobile view
  };

  const formatLastMessage = (conversation: any) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return "No messages yet";
    }
    const lastMessage = conversation.messages[0];
    const content = lastMessage.decryptedContent || lastMessage.content;
    // Return full content - let line-clamp-2 handle truncation
    return content;
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div ref={ref} {...props}>
      <div className="h-dvh w-full overflow-visible">
        <MessagingChatHeader
          className="hidden sm:flex"
          page={page}
          paginate={paginate}
          onOpen={onOpen}
          chatCount={conversations?.length || 0}
        />
        <div className="mb-6 flex flex-col gap-4 px-3 sm:px-6">
          <div>
            <div className="mb-4 lg:mb-4">
              <Input
                aria-label="Search"
                labelPlacement="outside"
                placeholder="Search conversations..."
                radius="md"
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={
                  <Icon
                    className="text-default-500 [&>g]:stroke-[2px]"
                    icon="solar:magnifer-linear"
                    width={18}
                  />
                }
                variant="bordered"
              />
            </div>
            <div className="mt-4">
              <Tabs
                aria-label="Options"
                fullWidth
                classNames={{
                  tabList:
                    "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-primary",
                  tab: "max-w-fit px-0 h-12",
                  tabContent: "group-data-[selected=true]:text-primary",
                }}
                color="primary"
                variant="underlined"
                className="w-full"
                selectedKey={activeTab}
                onSelectionChange={(key) => setActiveTab(key.toString())}
              >
                <Tab key="inbox" title="Inbox" />
                <Tab key="unread" title="Unread" />
              </Tabs>
            </div>
          </div>
        </div>
        <ScrollShadow className="flex h-full max-h-[calc(100dvh-200px)] flex-col gap-6 overflow-y-auto px-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Spinner size="lg" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-default-500 py-8">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </div>
          ) : (
            <Listbox
              classNames={{
                base: "py-2",
              }}
              variant="flat"
            >
              {Array.isArray(filteredConversations)
                ? filteredConversations.map((conversation: any) => {
                    const isOrgConversation =
                      conversation.type === "ORGANIZATION" ||
                      conversation.orgConversation;
                    let displayName = "Unknown";
                    let displayImage = undefined;
                    let displayBadge = null;

                    if (isOrgConversation && conversation.orgConversation) {
                      // This is an organization conversation
                      displayName =
                        conversation.orgConversation.organization?.name ||
                        "Organization";
                      displayImage =
                        conversation.orgConversation.organization?.logo;
                      displayBadge = (
                        <Badge color="primary" size="sm" className="ml-2">
                          ORG
                        </Badge>
                      );
                    } else {
                      // Regular user conversation
                      const otherParticipants =
                        conversation.participants.filter(
                          (p: any) => p.user.id !== currentUserId,
                        );
                      const displayUser = otherParticipants[0]?.user;
                      displayName = displayUser?.name || "Unknown User";
                      displayImage = displayUser?.image;
                    }

                    const currentUserParticipant =
                      conversation.participants.find(
                        (p: any) => p.user.id === currentUserId,
                      );
                    const unreadCount =
                      currentUserParticipant?.unreadCount || 0;

                    return (
                      <ListboxItem
                        key={conversation.id}
                        className={cn("mb-2 px-4 h-[72px]", {
                          "bg-zinc-950":
                            selectedConversationId === conversation.id,
                        })}
                        textValue={displayName}
                        onPress={() => handleConversationClick(conversation.id)}
                      >
                        <div className="flex w-full gap-3 items-center h-full">
                          <div className="flex items-center grow overflow-hidden gap-3 h-full">
                            {unreadCount === 0 ? (
                              <Avatar
                                alt={displayName}
                                className="flex-shrink-0 w-12 h-12"
                                size="md"
                                src={displayImage || undefined}
                              />
                            ) : (
                              <Badge
                                color="danger"
                                content={unreadCount}
                                size="sm"
                              >
                                <Avatar
                                  alt={displayName}
                                  className="flex-shrink-0 w-12 h-12"
                                  size="md"
                                  src={displayImage || undefined}
                                />
                              </Badge>
                            )}

                            <div className="min-w-0 flex-1 overflow-hidden flex flex-col justify-center">
                              <div className="text-small text-default-foreground font-semibold line-clamp-1 flex items-center">
                                {displayName}
                                {displayBadge}
                              </div>
                              <div className="text-small text-default-500 line-clamp-2 leading-tight">
                                {formatLastMessage(conversation)}
                              </div>
                            </div>
                          </div>
                          <div className="text-small text-default-400 flex-shrink-0 ml-2">
                            {formatTime(conversation.lastMessageAt)}
                          </div>
                        </div>
                      </ListboxItem>
                    );
                  })
                : null}
            </Listbox>
          )}
        </ScrollShadow>
      </div>
    </div>
  );
});

MessageChatInbox.displayName = "MessageChatInbox";

export default MessageChatInbox;
