"use client";

import type { InputProps } from "@heroui/react";

import React from "react";
import { Button, Input, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useUploadThing } from "@/lib/uploadclient";
import { toast } from "sonner";

export interface MessagingChatInputProps
  extends Omit<InputProps, "onValueChange"> {
  onSendMessage?: (message: string, imageUrl?: string) => void;
  onTyping?: (isTyping: boolean) => void;
}

const MessagingChatInput = React.forwardRef<
  HTMLInputElement,
  MessagingChatInputProps
>(({ onSendMessage, onTyping, ...props }, ref) => {
  const [message, setMessage] = React.useState<string>("");
  const [isUploading, setIsUploading] = React.useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("chatImageUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const imageUrl = res[0].url;
        if (onSendMessage) {
          onSendMessage(message.trim() || "Sent an image", imageUrl);
          setMessage("");
        }
      }
      setIsUploading(false);
    },
    onUploadError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
    },
  });

  const handleSend = (imageUrl?: string) => {
    if ((message.trim() || imageUrl) && onSendMessage) {
      onSendMessage(
        message.trim() || (imageUrl ? "Sent an image" : ""),
        imageUrl,
      );
      setMessage("");
      if (onTyping) onTyping(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsUploading(true);
      try {
        await startUpload([file]);
      } catch (error) {
        // Upload error
        toast.error("Failed to upload image");
        setIsUploading(false);
      }
    } else {
      toast.error("Please select an image file");
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      // Only clear typing on unmount, not on every render
    };
  }, []); // Empty dependency array - only run on mount/unmount

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
                onPress={() => handleSend()}
                isDisabled={!message.trim() && !isUploading}
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
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Tooltip showArrow content="Add image">
            <Button
              isIconOnly
              radius="full"
              variant="light"
              onPress={() => fileInputRef.current?.click()}
              isLoading={isUploading}
            >
              <Icon
                className="text-default-500"
                icon="solar:gallery-add-linear"
                width={20}
              />
            </Button>
          </Tooltip>
        </>
      }
      value={message}
      variant="bordered"
      onValueChange={handleValueChange}
      onKeyDown={handleKeyPress}
      {...props}
    />
  );
});

MessagingChatInput.displayName = "MessagingChatInput";

export default MessagingChatInput;
