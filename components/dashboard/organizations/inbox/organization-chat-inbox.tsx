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

import OrganizationChatHeader from "./organization-chat-header";

export type OrganizationChatInboxProps =
  React.HTMLAttributes<HTMLDivElement> & {
    page?: number;
    paginate?: (direction: number) => void;
    onOpen?: () => void;
    organizationId: string;
  };

const OrganizationChatInbox = React.forwardRef<
  HTMLDivElement,
  OrganizationChatInboxProps
>(({ page, paginate, onOpen, organizationId, ...props }, ref) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get("conversation");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("inbox");

  // Fetch conversations for organization
  const { data: conversations = [], isLoading } =
    trpc.organization.getConversations.useQuery(
      {
        organizationId,
      },
      {
        enabled: !!organizationId,
      },
    );

  // Filter conversations based on search and tab
  const filteredConversations = React.useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];

    let filtered = [...conversations];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((conv: any) => {
        const otherParticipants = conv.participants.filter((p: any) => {
          // Find participants who are not members of this organization
          const isMember =
            organizationId &&
            p.user.organizationMembers?.some(
              (m: any) => m.organizationId === organizationId,
            );
          return !isMember;
        });
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
        const orgConv = conv.orgConversation;
        return (
          orgConv &&
          (orgConv.status === "OPEN" || orgConv.status === "IN_PROGRESS")
        );
      });
    }

    return filtered;
  }, [conversations, searchQuery, activeTab, organizationId]);

  const handleConversationClick = (conversationId: string) => {
    router.push(`/dashboard/organization/inbox?conversation=${conversationId}`);
    if (paginate) paginate(1); // For mobile view
  };

  const formatLastMessage = (conversation: any) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return "No messages yet";
    }
    const lastMessage = conversation.messages[0];
    const content = lastMessage.decryptedContent || lastMessage.content;
    return content;
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div ref={ref} {...props}>
      <div className="h-dvh w-full overflow-visible">
        <OrganizationChatHeader
          className="hidden sm:flex"
          page={page}
          paginate={paginate}
          onOpen={onOpen}
          chatCount={filteredConversations.length}
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
                <Tab key="inbox" title="All" />
                <Tab key="unread" title="Active" />
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
                    const otherParticipants = conversation.participants.filter(
                      (p: any) => {
                        // Find participants who are not members of this organization
                        const isMember =
                          organizationId &&
                          p.user.organizationMembers?.some(
                            (m: any) => m.organizationId === organizationId,
                          );
                        return !isMember;
                      },
                    );
                    const displayUser = otherParticipants[0]?.user;
                    const orgConv = conversation.orgConversation;
                    const unreadCount = otherParticipants[0]?.unreadCount || 0;

                    return (
                      <ListboxItem
                        key={conversation.id}
                        className={cn("mb-2 px-4 h-[72px]", {
                          "bg-zinc-950":
                            selectedConversationId === conversation.id,
                        })}
                        textValue={displayUser?.name || "Unknown"}
                        onPress={() => handleConversationClick(conversation.id)}
                      >
                        <div className="flex w-full gap-3 items-center h-full">
                          <div className="flex items-center grow overflow-hidden gap-3 h-full">
                            {unreadCount === 0 ? (
                              <Avatar
                                alt={displayUser?.name}
                                className="flex-shrink-0 w-12 h-12"
                                size="md"
                                src={displayUser?.image || undefined}
                              />
                            ) : (
                              <Badge
                                color="danger"
                                content={unreadCount}
                                size="sm"
                              >
                                <Avatar
                                  alt={displayUser?.name}
                                  className="flex-shrink-0 w-12 h-12"
                                  size="md"
                                  src={displayUser?.image || undefined}
                                />
                              </Badge>
                            )}

                            <div className="min-w-0 flex-1 overflow-hidden flex flex-col justify-center">
                              <div className="text-small text-default-foreground font-semibold line-clamp-1 flex items-center gap-2">
                                {displayUser?.name || "Unknown User"}
                                {orgConv?.priority === "HIGH" && (
                                  <Badge color="warning" size="sm">
                                    High
                                  </Badge>
                                )}
                                {orgConv?.priority === "URGENT" && (
                                  <Badge color="danger" size="sm">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                              <div className="text-small text-default-500 line-clamp-2 leading-tight">
                                {formatLastMessage(conversation)}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-small text-default-400">
                              {formatTime(conversation.lastMessageAt)}
                            </div>
                            {orgConv?.category && (
                              <Badge variant="flat" size="sm">
                                {orgConv.category}
                              </Badge>
                            )}
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

OrganizationChatInbox.displayName = "OrganizationChatInbox";

export default OrganizationChatInbox;
