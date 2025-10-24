"use client";

import React from "react";
import { Avatar, Button } from "@heroui/react";
import { cn } from "@heroui/react";
import { Icon } from "@iconify/react";

export type OrganizationChatMessageProps = {
  messageId: string;
  avatar?: string;
  message?: string;
  imageUrl?: string;
  name?: string;
  time?: string;
  isRTL?: boolean;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
};

const OrganizationChatMessage = React.memo(
  ({
    messageId,
    avatar,
    message,
    imageUrl,
    name,
    time,
    isRTL = false,
    canDelete = false,
    onDelete,
  }: OrganizationChatMessageProps) => {
    const messageContent = (
      <>
        <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
          <div className="relative flex-none">
            <Avatar
              src={avatar}
              name={name}
              size="sm"
              className="flex-shrink-0"
            />
          </div>
          <div
            className={cn("flex w-full flex-col gap-1", isRTL && "items-end")}
          >
            <div
              className={cn(
                "flex items-center gap-2",
                isRTL && "flex-row-reverse",
              )}
            >
              <span className="text-small font-semibold text-default-600">
                {name}
              </span>
              <span className="text-tiny text-default-400">{time}</span>
            </div>
            <div
              className={cn(
                "group relative flex items-center gap-2",
                isRTL && "flex-row-reverse",
              )}
            >
              <div
                className={cn(
                  "relative inline-block rounded-2xl px-4 py-2 text-small",
                  isRTL
                    ? "bg-primary text-primary-foreground"
                    : "bg-default-100",
                )}
              >
                <p>{message}</p>
              </div>
              {canDelete && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onPress={() => onDelete?.(messageId)}
                >
                  <Icon icon="solar:trash-bin-minimalistic-linear" width={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </>
    );

    return <div className="flex gap-3">{messageContent}</div>;
  },
);

OrganizationChatMessage.displayName = "OrganizationChatMessage";

export default OrganizationChatMessage;
