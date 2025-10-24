"use client";

import { Avatar, AvatarProps } from "@heroui/react";
import { Icon } from "@iconify/react";

interface UserAvatarProps extends Omit<AvatarProps, "src"> {
  src?: string | null;
  name?: string;
}

export default function UserAvatar({
  src,
  name,
  className,
  ...props
}: UserAvatarProps) {
  // If no image source, show icon fallback
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-default-200 ${
          props.size === "sm"
            ? "w-8 h-8"
            : props.size === "lg"
              ? "w-12 h-12"
              : "w-10 h-10"
        } ${props.radius === "md" ? "rounded-md" : "rounded-full"} ${className || ""}`}
      >
        <Icon
          icon="solar:user-circle-bold"
          className={`text-default-500 ${
            props.size === "sm"
              ? "w-5 h-5"
              : props.size === "lg"
                ? "w-8 h-8"
                : "w-6 h-6"
          }`}
        />
      </div>
    );
  }

  // Otherwise use the regular Avatar component
  return <Avatar src={src} name={name} className={className} {...props} />;
}
