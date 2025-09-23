"use client";

import React from "react";
import {
  Avatar,
  Tabs,
  Tab,
  Link,
  Card,
  CardBody,
  ScrollShadow,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";

import MessagingChatHeader from "./messaging-chat-header";

export type MessagingChatProfileProps = React.HTMLAttributes<HTMLDivElement> & {
  paginate?: (direction: number) => void;
};

const MessagingChatProfile = React.forwardRef<
  HTMLDivElement,
  MessagingChatProfileProps
>(({ paginate, ...props }, ref) => {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversation") || "";
  const [notes, setNotes] = React.useState("");

  // Get current user session
  const { data: session } = useSession();
  const { data: conversationData } = trpc.chat.conversations.useQuery();
  const conversation = conversationData?.find((c) => c.id === conversationId);

  // For DMs, show the other participant's info
  const otherParticipant =
    conversation && conversation.type === "DIRECT"
      ? conversation.participants.find((p) => p.userId !== session?.user?.id)
      : null;

  // For group chats, this would need different handling
  const displayUser = otherParticipant?.user;

  // Get messages with attachments
  const { data: messagesData } = trpc.chat.messages.useQuery(
    {
      conversationId,
      limit: 100,
    },
    {
      enabled: !!conversationId,
    },
  );

  // Filter messages with images/files
  const mediaMessages = React.useMemo(() => {
    if (!messagesData?.messages) return [];
    return messagesData.messages.filter((msg) => {
      if (msg.deletedAt) return false;
      const metadata = msg.metadata as any;
      return metadata?.imageUrl || msg.type === "IMAGE" || msg.type === "FILE";
    });
  }, [messagesData]);

  // Load notes from localStorage
  React.useEffect(() => {
    if (conversationId) {
      const savedNotes = localStorage.getItem(`chat-notes-${conversationId}`);
      setNotes(savedNotes || "");
    }
  }, [conversationId]);

  // Save notes to localStorage
  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (conversationId) {
      localStorage.setItem(`chat-notes-${conversationId}`, value);
    }
  };

  return (
    <div ref={ref} className={cn("h-full flex flex-col", props.className)}>
      <div className="h-full w-full flex flex-col">
        <MessagingChatHeader
          className="hidden sm:flex lg:hidden flex-shrink-0"
          paginate={paginate}
        />
        <div className="border-t-small border-default-200 flex-1 min-h-0 overflow-hidden lg:border-none">
          <ScrollShadow className="h-full overflow-y-auto p-2">
            <div className="flex flex-col gap-4">
              {/* Profile Info */}
              <div className="flex flex-col items-center px-4 pt-2 text-center">
                <Avatar
                  className="h-20 w-20"
                  src={
                    displayUser?.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser?.id || "default"}`
                  }
                />
                <h3 className="text-small text-foreground mt-2 font-semibold">
                  {displayUser?.name || "Unknown User"}
                </h3>
                <span className="text-small text-default-400 font-medium">
                  @{displayUser?.username || "unknown"}
                </span>
                <div className="mt-2 flex gap-2">
                  <Link href="#">
                    <Icon
                      className="text-default-400"
                      icon="solar:user-rounded-linear"
                      width={23}
                    />
                  </Link>
                  <Link href="#">
                    <Icon
                      className="text-default-400"
                      icon="solar:map-point-linear"
                      width={22}
                    />
                  </Link>
                  <Link href="#">
                    <Icon
                      className="text-default-400"
                      icon="solar:phone-rounded-linear"
                      width={24}
                    />
                  </Link>
                </div>
              </div>

              {/* Notes */}
              <div className="px-2">
                <div className="text-small text-foreground font-semibold mb-2">
                  Notes
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add notes about this conversation..."
                  minRows={3}
                  maxRows={8}
                  classNames={{
                    input: "min-h-[80px]",
                    inputWrapper: "bg-content2",
                  }}
                />
              </div>

              {/* Media / Links Tabs */}
              <div className="mb-4 px-2">
                <Tabs
                  fullWidth
                  classNames={{
                    cursor: "group-data-[selected=true]:bg-content1",
                  }}
                >
                  <Tab key="media" title="Media" />
                  <Tab key="files" title="Files" />
                </Tabs>
              </div>
            </div>

            {/* Media */}
            <div className="rounded-large bg-content1 mx-2 p-4">
              <div className="overflow-y-hidden">
                {mediaMessages.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-3">
                    {mediaMessages.map((message) => (
                      <Card
                        key={message.id}
                        isPressable
                        radius="sm"
                        shadow="sm"
                        onPress={() => {
                          const metadata = message.metadata as any;
                          if (metadata?.imageUrl) {
                            window.open(metadata.imageUrl, "_blank");
                          } else if (message.type === "IMAGE") {
                            window.open(
                              metadata?.url || message.content,
                              "_blank",
                            );
                          }
                        }}
                      >
                        <CardBody className="p-0 aspect-square">
                          {(message.metadata as any)?.imageUrl ? (
                            <img
                              alt="Shared image"
                              className="w-full h-full object-cover rounded-sm"
                              src={(message.metadata as any).imageUrl}
                            />
                          ) : message.type === "IMAGE" ? (
                            <img
                              alt="Shared image"
                              className="w-full h-full object-cover rounded-sm"
                              src={
                                (message.metadata as any)?.url ||
                                message.content
                              }
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-content2">
                              <Icon
                                icon="solar:file-bold"
                                width={32}
                                className="text-default-400"
                              />
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Icon
                      icon="solar:gallery-minimalistic-linear"
                      width={48}
                      className="text-default-300 mb-2"
                    />
                    <p className="text-small text-default-400">
                      No media shared yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollShadow>
        </div>
      </div>
    </div>
  );
});

MessagingChatProfile.displayName = "MessagingChatProfile";

export default MessagingChatProfile;
