"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { HELP_CONTENT, searchHelp, HelpSearchResult } from "@/lib/help-content";

function SearchResults({ query }: { query: string }) {
  const results = searchHelp(query);

  if (results.length === 0) {
    return React.createElement(
      "div",
      { className: "py-10 text-center text-default-500 text-sm" },
      `No results for "${query}" — try a different term or contact us`,
      " ",
      React.createElement(
        Link,
        { href: "/contact", className: "text-primary underline" },
        "contact us"
      )
    );
  }

  const grouped = results.reduce<Record<string, HelpSearchResult[]>>((acc, item) => {
    if (!acc[item.sectionLabel]) acc[item.sectionLabel] = [];
    acc[item.sectionLabel].push(item);
    return acc;
  }, {});

  return React.createElement(
    "div",
    { className: "space-y-8" },
    Object.entries(grouped).map(([label, items]) =>
      React.createElement(
        "div",
        { key: label },
        React.createElement(
          "h3",
          { className: "text-xs font-semibold uppercase tracking-widest text-default-400 mb-3" },
          label
        ),
        React.createElement(
          "div",
          { className: "space-y-3" },
          items.map((item, idx) =>
            React.createElement(
              "div",
              {
                key: `${label}-${idx}`,
                className: "rounded-xl border border-divider bg-content1 p-4",
              },
              React.createElement(
                "p",
                { className: "text-sm font-semibold mb-1" },
                item.q
              ),
              React.createElement(
                "p",
                { className: "text-sm text-default-500" },
                item.a
              )
            )
          )
        )
      )
    )
  );
}

export function HelpPage() {
  const [activeTab, setActiveTab] = useState(HELP_CONTENT[0].id);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");

  function toggleItem(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const activeSection = HELP_CONTENT.find((s) => s.id === activeTab) ?? HELP_CONTENT[0];
  const isSearching = query.trim().length > 0;

  return React.createElement(
    "div",
    { className: "min-h-screen bg-background" },

    // Hero section
    React.createElement(
      "section",
      { className: "py-16 px-4 text-center bg-content1 border-b border-divider" },
      React.createElement(
        "h1",
        { className: "text-3xl sm:text-4xl font-bold mb-3" },
        "How can we help?"
      ),
      React.createElement(
        "p",
        { className: "text-default-500 mb-8" },
        "Answers for buyers, sellers, and everything in between"
      ),
      // Search input
      React.createElement(
        "div",
        { className: "relative max-w-xl mx-auto" },
        React.createElement(Icon, {
          icon: "lucide:search",
          className: "absolute left-3 top-1/2 -translate-y-1/2 text-default-400 w-4 h-4",
        }),
        React.createElement("input", {
          type: "text",
          value: query,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
          placeholder: "Search help articles...",
          className:
            "w-full pl-9 pr-10 py-2.5 rounded-xl border border-divider bg-background text-sm focus:outline-none focus:border-primary",
        }),
        query
          ? React.createElement(
              "button",
              {
                onClick: () => setQuery(""),
                className: "absolute right-3 top-1/2 -translate-y-1/2 text-default-400 hover:text-default-600",
                "aria-label": "Clear search",
              },
              React.createElement(Icon, { icon: "lucide:x", className: "w-4 h-4" })
            )
          : null
      )
    ),

    // Content section
    React.createElement(
      "section",
      { className: "max-w-3xl mx-auto px-4 py-10" },

      // Tab pills — only when not searching
      !isSearching
        ? React.createElement(
            "div",
            {
              className: "flex gap-2 mb-8 overflow-x-auto whitespace-nowrap pb-1",
            },
            HELP_CONTENT.map((section) =>
              React.createElement(
                "button",
                {
                  key: section.id,
                  onClick: () => setActiveTab(section.id),
                  className:
                    section.id === activeTab
                      ? "px-4 py-1.5 rounded-full text-sm font-medium bg-primary text-primary-foreground shrink-0"
                      : "px-4 py-1.5 rounded-full text-sm font-medium border border-divider text-default-500 shrink-0 hover:border-primary hover:text-primary transition-colors",
                },
                section.label
              )
            )
          )
        : null,

      // Accordion (tab view) or search results
      isSearching
        ? React.createElement(SearchResults, { query })
        : React.createElement(
            "div",
            { className: "space-y-3" },
            activeSection.questions.map((item, idx) => {
              const key = `${activeSection.id}-${idx}`;
              const isOpen = openItems.has(key);
              return React.createElement(
                "div",
                {
                  key,
                  className: isOpen
                    ? "rounded-xl border border-primary bg-content1 overflow-hidden"
                    : "rounded-xl border border-divider bg-content1 overflow-hidden",
                },
                React.createElement(
                  "button",
                  {
                    onClick: () => toggleItem(key),
                    className:
                      "w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-left",
                  },
                  React.createElement("span", null, item.q),
                  React.createElement(Icon, {
                    icon: isOpen ? "lucide:minus" : "lucide:plus",
                    className: "w-4 h-4 text-default-400 shrink-0",
                  })
                ),
                isOpen
                  ? React.createElement(
                      "div",
                      { className: "px-4 pb-4 text-sm text-default-500" },
                      item.a
                    )
                  : null
              );
            })
          ),

      // Still need help strip
      React.createElement(
        "div",
        {
          className:
            "mt-12 rounded-xl border border-divider bg-content1 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
        },
        React.createElement(
          "div",
          null,
          React.createElement(
            "p",
            { className: "font-semibold text-sm" },
            "Still need help?"
          ),
          React.createElement(
            "p",
            { className: "text-xs text-default-500 mt-0.5" },
            "Our team usually responds within 24 hours."
          )
        ),
        React.createElement(
          Link,
          {
            href: "/contact",
            className:
              "px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity",
          },
          "Contact us →"
        )
      )
    )
  );
}
