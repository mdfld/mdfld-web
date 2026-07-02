import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

const {
  mockUpdateRoleMutate,
  mockRemoveMemberMutate,
  mockInvalidate,
} = vi.hoisted(() => ({
  mockUpdateRoleMutate: vi.fn(),
  mockRemoveMemberMutate: vi.fn(),
  mockInvalidate: vi.fn(),
}));

vi.mock("@/lib/trpc-client", () => ({
  trpc: {
    useUtils: () => ({
      organization: { get: { invalidate: mockInvalidate } },
    }),
    organization: {
      get: {
        useQuery: () => ({
          data: {
            id: "org_1",
            role: "owner",
            members: [
              {
                id: "member_row_2",
                role: "member",
                createdAt: "2026-01-01T00:00:00.000Z",
                user: {
                  id: "user_2",
                  name: "Sam",
                  email: "sam@example.com",
                  image: null,
                },
              },
            ],
          },
        }),
      },
      updateMemberRole: {
        useMutation: () => ({ mutate: mockUpdateRoleMutate, isPending: false }),
      },
      removeMember: {
        useMutation: () => ({ mutate: mockRemoveMemberMutate, isPending: false }),
      },
    },
  },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock("@heroui/react", () => {
  const passthrough =
    () =>
    (props: Record<string, unknown>) =>
      React.createElement("div", props as object, props.children as never);
  return {
    Table: passthrough(),
    TableHeader: passthrough(),
    TableColumn: passthrough(),
    TableBody: passthrough(),
    TableRow: passthrough(),
    TableCell: passthrough(),
    User: passthrough(),
    Chip: passthrough(),
    Button: passthrough(),
    Dropdown: passthrough(),
    DropdownTrigger: passthrough(),
    DropdownMenu: passthrough(),
    DropdownItem: passthrough(),
  };
});

vi.mock("@iconify/react", () => ({
  Icon: (props: Record<string, unknown>) =>
    React.createElement("span", { "data-icon": props.icon }),
}));

import OrganizationMembersSettings from "@/components/dashboard/organizations/settings/organization-members-settings";

type AnyElement = React.ReactElement<Record<string, unknown>>;

function findByKey(node: unknown, key: string): AnyElement | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findByKey(child, key);
      if (found) return found;
    }
    return null;
  }
  const el = node as AnyElement;
  if (el.key === key || el.key === `.$${key}`) return el;
  const children = el.props?.children;
  return children ? findByKey(children, key) : null;
}

describe("OrganizationMembersSettings actions", () => {
  beforeEach(() => {
    mockUpdateRoleMutate.mockReset();
    mockRemoveMemberMutate.mockReset();
    mockInvalidate.mockReset();
  });

  function renderTree() {
    return OrganizationMembersSettings({
      organizationSlug: "test-org",
    }) as AnyElement;
  }

  it("change-role action calls updateMemberRole with the membership row id", () => {
    const tree = renderTree();
    const item = findByKey(tree, "change-role");
    expect(item).not.toBeNull();
    (item!.props.onPress as () => void)();
    expect(mockUpdateRoleMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_1",
        memberId: "member_row_2",
        role: "admin",
      }),
    );
  });

  it("remove action calls removeMember with the membership row id", () => {
    const tree = renderTree();
    const item = findByKey(tree, "remove");
    expect(item).not.toBeNull();
    (item!.props.onPress as () => void)();
    expect(mockRemoveMemberMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org_1",
        memberId: "member_row_2",
      }),
    );
  });
});
