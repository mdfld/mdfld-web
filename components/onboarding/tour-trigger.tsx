"use client";

import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface TourTriggerProps {
  onTrigger: () => void;
}

export function TourTrigger({ onTrigger }: TourTriggerProps) {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="flat"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-md"
      onPress={onTrigger}
      aria-label="Replay tour"
    >
      <Icon icon="lucide:help-circle" width={18} />
    </Button>
  );
}
