"use client";
import type { MessagingChatMessageProps } from "./data";

import React, { useCallback } from "react";
import { Avatar, Button } from "@heroui/react";
import { cn } from "@heroui/react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

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
          <Avatar src={avatar} size="sm" className="w-8 h-8" />
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

    const [isHovered, setIsHovered] = React.useState(false);

    const Message = () => (
      <div className="flex max-w-[70%] flex-col">
        <div
          className={cn("flex items-center gap-2 mb-1", isRTL && "justify-end")}
        >
          <span className="text-xs font-medium text-default-600">{name}</span>
          <span className="text-xs text-default-400">{time}</span>
        </div>
        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={cn(
              "rounded-2xl relative w-fit max-w-full px-4 py-2.5",
              isRTL
                ? "bg-primary text-primary-foreground"
                : "bg-zinc-950 text-zinc-100 dark:bg-zinc-900",
              classNames?.base,
            )}
          >
            <div ref={messageRef} className="text-sm">
              <div
                className={cn(
                  "whitespace-pre-wrap break-words",
                  isDeleted && "italic opacity-50",
                )}
              >
                {message}
              </div>
              {imageUrl && !isDeleted && (
                <img
                  alt={`Image sent by ${name}`}
                  className="mt-2 rounded-lg cursor-pointer max-w-[250px] max-h-[200px] object-cover"
                  src={imageUrl}
                />
              )}
            </div>
          </div>

          {/* Creative hover controls - simplified positioning */}
          {!isDeleted && isHovered && (
            <div
              className={cn(
                "absolute flex items-center gap-1",
                isRTL
                  ? "right-full pr-2 top-1/2 -translate-y-1/2"
                  : "left-full pl-2 top-1/2 -translate-y-1/2",
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
        <Message />
      </div>
    );
  },
);

MessagingChatMessage.displayName = "MessagingChatMessage";

export default MessagingChatMessage;
