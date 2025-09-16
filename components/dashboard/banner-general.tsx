"use client";

import React from "react";
import { Button, Link } from "@heroui/react";
import { Icon } from "@iconify/react";

interface BannerProps {
  text: string;
  button: string;
  href?: string;
  onClose?: () => void;
}

export default function DashBanner({
  text,
  button,
  href = "#",
  onClose,
}: BannerProps) {
  return (
    <div className="border-divider bg-content1 flex w-full items-center justify-between gap-x-3 border-1 px-6 py-2 rounded-lg sm:px-3.5 shadow-small">
      <p className="text-small text-foreground flex-1">
        <Link className="text-inherit" href={href}>
          {text}&nbsp;
        </Link>
      </p>
      <div className="flex items-center gap-x-3">
        <Button
          as={Link}
          className="group text-small relative h-9 overflow-hidden bg-transparent font-normal"
          color="default"
          endContent={
            <Icon
              className="flex-none outline-hidden transition-transform group-data-[hover=true]:translate-x-0.5 [&>path]:stroke-2"
              icon="solar:arrow-right-linear"
              width={16}
            />
          }
          href={href}
          style={{
            border: "solid 2px transparent",
            backgroundImage: `linear-gradient(hsl(var(--heroui-background)), hsl(var(--heroui-background))), linear-gradient(to right, #14b8a6, #0891b2)`,
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
          }}
          variant="bordered"
        >
          {button}
        </Button>
        <Button
          isIconOnly
          className="-m-1"
          size="sm"
          variant="light"
          onPress={onClose}
        >
          <span className="sr-only">Close Banner</span>
          <Icon className="text-default-500" icon="lucide:x" width={20} />
        </Button>
      </div>
    </div>
  );
}
