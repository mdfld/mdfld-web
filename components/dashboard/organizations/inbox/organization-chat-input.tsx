"use client";

import type { InputProps } from "@heroui/react";

import React from "react";
import { Button, Input, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

export interface OrganizationChatInputProps
  extends Omit<InputProps, "onValueChange"> {
  onSendMessage?: (message: string, imageUrl?: string) => void;
  onTyping?: (isTyping: boolean) => void;
}

const OrganizationChatInput = React.forwardRef<
  HTMLInputElement,
  OrganizationChatInputProps
>(({ onSendMessage, onTyping, ...props }, ref) => {
  const [message, setMessage] = React.useState<string>("");
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage("");
      if (onTyping) onTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleValueChange = (value: string) => {
    setMessage(value);

    // Handle typing indicator
    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (value.trim()) {
        onTyping(true);
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 3000);
      } else {
        onTyping(false);
      }
    }
  };

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Input
      ref={ref}
      aria-label="message"
      className=""
      classNames={{
        innerWrapper: "items-center",
        label: "hidden",
        input: "py-0 text-medium",
        inputWrapper: "h-15 py-[10px]",
      }}
      endContent={
        <div className="flex items-center">
          <Tooltip showArrow content="Send message">
            <div className="flex h-10 flex-col justify-center">
              <Button
                isIconOnly
                className="bg-foreground h-[30px] w-[30px] min-w-[30px] leading-[30px]"
                radius="lg"
                onPress={handleSend}
                isDisabled={!message.trim()}
              >
                <Icon
                  className="text-default-50 cursor-pointer [&>path]:stroke-[2px]"
                  icon="solar:arrow-up-linear"
                  width={20}
                />
              </Button>
            </div>
          </Tooltip>
        </div>
      }
      placeholder="Type a message..."
      radius="lg"
      startContent={
        <Tooltip showArrow content="Add image">
          <Button isIconOnly radius="full" variant="light" isDisabled>
            <Icon
              className="text-default-500"
              icon="solar:gallery-add-linear"
              width={20}
            />
          </Button>
        </Tooltip>
      }
      value={message}
      variant="bordered"
      onValueChange={handleValueChange}
      onKeyDown={handleKeyPress}
      {...props}
    />
  );
});

OrganizationChatInput.displayName = "OrganizationChatInput";

export default OrganizationChatInput;
