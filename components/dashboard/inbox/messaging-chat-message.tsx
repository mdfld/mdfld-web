"use client";
import type { MessagingChatMessageProps } from "./data";

import React, { useCallback, useMemo, useState } from "react";
import { Button, Image, Card, CardFooter } from "@heroui/react";
import { cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import UserAvatar from "@/components/common/user-avatar";

const MemoizedImage = React.memo(
  ({ src, message }: { src: string; message?: string }) => (
    <Card
      isFooterBlurred
      className="border-none max-w-[400px] group cursor-pointer overflow-visible"
      radius="lg"
    >
      <Image
        src={src}
        alt="Message image"
        isBlurred
        className="object-cover"
        classNames={{
          wrapper: "!max-w-full",
          img: "w-full h-[250px] object-cover",
          blurredImg: "scale-110",
        }}
      />
      {message && (
        <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-2 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
          <p className="text-sm text-white/80 line-clamp-2 flex-1 mr-2">
            {message}
          </p>
          <Button
            isIconOnly
            className="text-tiny text-white bg-black/20 min-w-unit-8 w-unit-8 h-unit-8"
            radius="full"
            size="sm"
            variant="flat"
            onPress={() => window.open(src, "_blank")}
          >
            <Icon
              icon="solar:maximize-square-minimalistic-line-duotone"
              width={16}
            />
          </Button>
        </CardFooter>
      )}
    </Card>
  ),
);

const MessagingChatMessage = React.forwardRef<
  HTMLDivElement,
  MessagingChatMessageProps & {
    messageId?: string;
    onDelete?: (id: string) => void;
    canDelete?: boolean;
  }
>(
  (
    {
      avatar,
      name,
      time,
      message,
      isRTL,
      imageUrl,
      className,
      classNames,
      messageId,
      onDelete,
      canDelete = false,
      ...props
    },
    ref,
  ) => {
    const messageRef = React.useRef<HTMLDivElement>(null);
    const isDeleted = message === "This message has been deleted";

    const MessageAvatar = useCallback(
      () => (
        <div className="relative flex-none">
          <UserAvatar src={avatar} size="sm" radius="md" className="w-8 h-8" />
        </div>
      ),
      [avatar],
    );

    const handleCopy = useCallback(() => {
      if (!isDeleted) {
        navigator.clipboard.writeText(message);
        toast.success("Copied to clipboard");
      }
    }, [message, isDeleted]);

    const handleDelete = useCallback(() => {
      if (messageId && onDelete) {
        onDelete(messageId);
      }
    }, [messageId, onDelete]);

    const [isHovered, setIsHovered] = useState(false);

    const Message = useMemo(
      () => (
        <div className="flex max-w-[70%] flex-col">
          <div
            className={cn(
              "flex items-center gap-2 mb-1",
              isRTL && "justify-end",
            )}
          >
            <span className="text-xs font-medium text-default-600">{name}</span>
            <span className="text-xs text-default-400">{time}</span>
          </div>
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {imageUrl && !isDeleted ? (
              <MemoizedImage src={imageUrl} message={message} />
            ) : (
              <div
                className={cn(
                  "rounded-2xl relative w-full max-w-full overflow-hidden",
                  isRTL
                    ? "bg-zinc-950 text-primary-foreground"
                    : "bg-zinc-950 text-zinc-100 dark:bg-zinc-900",
                  classNames?.base,
                )}
              >
                <div ref={messageRef} className="text-sm">
                  <div
                    className={cn(
                      "whitespace-pre-wrap break-words px-4 py-2.5",
                      isDeleted && "italic opacity-50",
                    )}
                  >
                    {message}
                  </div>
                </div>
              </div>
            )}

            {!isDeleted && (
              <div
                className={cn(
                  "absolute flex items-center gap-1 transition-opacity duration-200",
                  isRTL
                    ? "right-full pr-2 top-1/2 -translate-y-1/2"
                    : "left-full pl-2 top-1/2 -translate-y-1/2",
                  isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
              >
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={handleCopy}
                  className="min-w-unit-8 w-unit-8 h-unit-8 hover:bg-zinc-800/50"
                >
                  <Icon
                    icon="solar:copy-linear"
                    width={16}
                    className="text-zinc-400"
                  />
                </Button>
                {canDelete && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={handleDelete}
                    className="min-w-unit-8 w-unit-8 h-unit-8 hover:bg-red-900/20"
                  >
                    <Icon
                      icon="solar:trash-bin-trash-linear"
                      width={16}
                      className="text-zinc-400 hover:text-red-400"
                    />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      ),
      [
        name,
        time,
        message,
        imageUrl,
        isRTL,
        isDeleted,
        isHovered,
        classNames,
        canDelete,
        handleCopy,
        handleDelete,
      ],
    );

    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          "flex gap-3 px-4 py-1",
          { "flex-row-reverse": isRTL },
          className,
        )}
      >
        <MessageAvatar />
        {Message}
      </div>
    );
  },
);

MessagingChatMessage.displayName = "MessagingChatMessage";

export default MessagingChatMessage;
