import { describe, it, expect, vi } from "vitest";

// Mock useState to return static initial values so HelpPage can be called
// as a plain function in node environment (no React renderer context).
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    useState: (initial: unknown) => [initial, vi.fn()],
  };
});

// Mock next/link to a plain anchor so JSON.stringify works
vi.mock("next/link", () => ({
  default: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("a", { href: props.href }, props.children);
  },
}));

// Mock @iconify/react to a simple span
vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) => {
    const React = require("react");
    return React.createElement("span", { "data-icon": props.icon });
  },
}));

import { HelpPage } from "@/components/help/help-page";

describe("HelpPage", () => {
  it("renders without crashing", () => {
    const result = HelpPage();
    expect(result).toBeTruthy();
  });

  it("renders the hero heading", () => {
    const result = JSON.stringify(HelpPage());
    expect(result).toContain("How can we help");
  });

  it("renders the search input placeholder", () => {
    const result = JSON.stringify(HelpPage());
    expect(result).toContain("Search help articles");
  });

  it("renders all 5 section tab labels", () => {
    const result = JSON.stringify(HelpPage());
    expect(result).toContain("Buying");
    expect(result).toContain("Selling");
    expect(result).toContain("Authentication");
    expect(result).toContain("Returns");
    expect(result).toContain("Contact");
  });

  it("renders the still need help strip", () => {
    const result = JSON.stringify(HelpPage());
    expect(result).toContain("Still need help");
  });

  it("renders a Contact us link to /contact", () => {
    const result = JSON.stringify(HelpPage());
    expect(result).toContain("/contact");
  });
});
