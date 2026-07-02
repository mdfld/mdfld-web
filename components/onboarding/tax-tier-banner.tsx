"use client";

import React from "react";
import { Icon } from "@iconify/react";

export function TaxTierBanner(_props: Record<string, never>) {
  const items = [
    { label: "Legal name", href: "/dashboard/organization/settings?tab=tax" },
    {
      label: "Business address",
      href: "/dashboard/organization/settings?tab=tax",
    },
    {
      label: "EIN or SSN (Tax ID)",
      href: "/dashboard/organization/settings?tab=tax",
    },
  ];

  return React.createElement(
    "div",
    { className: "border border-warning rounded-xl p-4 bg-warning-50 mb-4" },
    React.createElement(
      "div",
      { className: "flex items-center gap-2 mb-2" },
      React.createElement(Icon, {
        icon: "lucide:alert-triangle",
        className: "text-warning",
        width: 16,
      }),
      React.createElement(
        "p",
        { className: "text-sm font-semibold text-warning-700" },
        "Tax information required"
      )
    ),
    React.createElement(
      "p",
      { className: "text-xs text-warning-700 mb-3" },
      "You've reached $500 in sales this year. US law requires you to complete your tax info before your next payout."
    ),
    React.createElement(
      "ul",
      { className: "space-y-1 mb-3" },
      items.map((item) =>
        React.createElement(
          "li",
          {
            key: item.label,
            className: "flex items-center justify-between text-xs",
          },
          React.createElement(
            "span",
            { className: "flex items-center gap-2 text-warning-700" },
            React.createElement(Icon, {
              icon: "lucide:circle",
              className: "text-warning-300",
              width: 12,
            }),
            item.label
          ),
          React.createElement(
            "a",
            {
              href: item.href,
              className: "text-warning-600 hover:underline text-xs",
            },
            "Go →"
          )
        )
      )
    ),
    React.createElement(
      "p",
      { className: "text-xs text-warning-600" },
      "Payouts are paused until this is complete."
    )
  );
}
