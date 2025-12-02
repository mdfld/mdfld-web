"use client";

import React from "react";
import { Image, ScrollShadow, Textarea, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import UserAvatar from "@/components/common/user-avatar";
import { cn } from "@heroui/react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
  const conversation = Array.isArray(conversationData)
    ? conversationData.find((c: any) => c.id === conversationId)
    : null;

  // For DMs, show the other participant's info
  const otherParticipant =
    conversation && conversation.type === "DIRECT"
      ? conversation.participants.find(
          (p: any) => p.userId !== session?.user?.id,
        )
      : null;

  // For group chats, this would need different handling
  const displayUser = otherParticipant?.user;
  const otherUser = otherParticipant?.user.username;

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
    return (messagesData.messages as any[]).filter((msg: any) => {
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

  const router = useRouter();

  return (
    <div ref={ref} className={cn("h-full flex flex-col", props.className)}>
      <div className="h-full w-full flex flex-col">
        {/* Mobile/Tablet header with back button */}
        <div className="lg:hidden border-b-small border-default-200 flex h-16 items-center gap-2 px-3 sm:px-6 flex-shrink-0">
          <Button
            isIconOnly
            className="text-default-500 min-w-8 h-8"
            variant="light"
            onPress={() => paginate?.(-1)}
          >
            <Icon icon="solar:arrow-left-linear" width={16} />
          </Button>
          <h2 className="text-large font-semibold">Profile</h2>
        </div>
        <div className="border-t-small border-default-200 flex-1 min-h-0 overflow-hidden lg:border-t-0 lg:border-none">
          <ScrollShadow className="h-full overflow-y-auto p-2">
            <div className="flex h-dvh items-center justify-between py-20 flex-col">
              <div className="flex w-full flex-col gap-10">
                {/* Profile Info */}
                <div className="flex flex-col items-center px-4 pt-2 text-center">
                  <UserAvatar
                    className="h-20 w-20"
                    size="lg"
                    radius="lg"
                    src={displayUser?.image}
                  />
                  <h3 className="text-small text-foreground mt-2 font-semibold">
                    {displayUser?.name || "Unknown User"}
                  </h3>
                  <span className="text-small text-default-400 font-medium">
                    @{displayUser?.username || "unknown"}
                  </span>
                  <div className="mt-2 py-5 flex gap-2">
                    <Button
                      variant="shadow"
                      size="md"
                      color="primary"
                      onPress={() => router.push(`/users/${otherUser}`)}
                      startContent={<Icon icon="iconamoon:profile-thin"></Icon>}
                      className="uppercase tracking-widest text-xs"
                    >
                      Profile
                    </Button>
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
                    variant="flat"
                    radius="sm"
                    maxRows={8}
                    classNames={{
                      input: "min-h-[80px]",
                      inputWrapper: "bg-zinc-950",
                    }}
                  />
                </div>

                {/* Media */}
                <div className="px-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-small text-foreground font-semibold">
                      Media
                    </div>
                    <span className="text-tiny text-default-400">
                      {mediaMessages.length} files
                    </span>
                  </div>
                  <div className="rounded-large bg-zinc-950 p-4 overflow-visible">
                    <ScrollShadow
                      className="h-[400px] overflow-y-auto overflow-x-visible w-full"
                      hideScrollBar={false}
                    >
                      {mediaMessages.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full px-1 overflow-visible">
                          {mediaMessages.map((message: any) => (
                            <div key={message.id} className="overflow-visible">
                              <Image
                                isZoomed
                                alt="Shared image"
                                className="w-full h-full object-cover rounded-lg cursor-pointer overflow-visible"
                                classNames={{
                                  wrapper: "overflow-visible",
                                  blurredImg: "scale-110",
                                }}
                                style={{
                                  aspectRatio: "1/1",
                                }}
                                src={
                                  (message.metadata as any)?.imageUrl ||
                                  (message.metadata as any)?.url ||
                                  message.content ||
                                  "/placeholder.jpg"
                                }
                                onClick={() => {
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
                                fallbackSrc="/placeholder.jpg"
                              />
                            </div>
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
                    </ScrollShadow>
                  </div>
                </div>
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
