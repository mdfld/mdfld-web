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
  const iconSize =
    props.size === "sm" ? "w-5 h-5" : props.size === "lg" ? "w-8 h-8" : "w-6 h-6";

  return (
    <Avatar
      src={src || undefined}
      name={name}
      showFallback={!src}
      fallback={
        !src ? (
          <Icon icon="solar:user-circle-bold" className={`text-default-500 ${iconSize}`} />
        ) : undefined
      }
      className={className}
      {...props}
    />
  );
}
