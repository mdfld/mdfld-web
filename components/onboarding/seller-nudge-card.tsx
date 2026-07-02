"use client";

import React from "react";
import { Button } from "@heroui/react";

interface SellerNudgeCardProps {
  onGetStarted: () => void;
  onDismiss: () => void;
}

export function SellerNudgeCard({ onGetStarted, onDismiss }: SellerNudgeCardProps) {
  return React.createElement(
    "div",
    { className: "border border-dashed border-divider rounded-xl p-4 bg-content1" },
    React.createElement(
      "p",
      { className: "text-sm font-semibold mb-1" },
      "Want to sell on MDFLD?"
    ),
    React.createElement(
      "p",
      { className: "text-xs text-default-500 mb-3" },
      "Set up a store and start listing your boots."
    ),
    React.createElement(
      "div",
      { className: "flex items-center gap-3" },
      React.createElement(Button, {
        size: "sm",
        color: "primary",
        onPress: onGetStarted,
        children: "Get started",
      }),
      React.createElement(
        "button",
        {
          className: "text-xs text-default-400 hover:text-default-600 transition-colors",
          onClick: onDismiss,
        },
        "Dismiss"
      )
    )
  );
}
