"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  User,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { toast } from "sonner";

const roleColors = {
  owner: "danger",
  admin: "warning",
  member: "primary",
} as const;

export default function OrganizationMembersSettings({
  organizationSlug,
}: {
  organizationSlug: string;
}) {
  // Fetch organization data with members
  const { data } = trpc.organization.get.useQuery(
    { slug: organizationSlug },
    { enabled: !!organizationSlug },
  );
  const organization = data as any;

  const handleRoleChange = (userId: string, newRole: string) => {
    // TODO: Implement role change mutation
    toast.info("Role change feature coming soon");
  };

  const handleRemoveMember = (userId: string) => {
    // TODO: Implement remove member mutation
    toast.info("Remove member feature coming soon");
  };

  const members = organization?.members || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-small text-default-500">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Icon icon="solar:add-circle-bold" width={20} />}
        >
          Invite Member
        </Button>
      </div>

      <Table aria-label="Organization members">
        <TableHeader>
          <TableColumn>MEMBER</TableColumn>
          <TableColumn>ROLE</TableColumn>
          <TableColumn>JOINED</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody>
          {members.map((member: any) => (
            <TableRow key={member.user.id}>
              <TableCell>
                <User
                  name={member.user.name}
                  description={member.user.email}
                  avatarProps={{
                    src: member.user.image,
                  }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  color={
                    roleColors[member.role as keyof typeof roleColors] ||
                    "default"
                  }
                  size="sm"
                  variant="flat"
                >
                  {member.role}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="text-small text-default-500">
                  {new Date(member.createdAt).toLocaleDateString()}
                </span>
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      isDisabled={
                        member.role === "owner" ||
                        organization?.role !== "owner"
                      }
                    >
                      <Icon icon="solar:menu-dots-bold" width={20} />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    <DropdownItem
                      key="change-role"
                      startContent={
                        <Icon icon="solar:user-id-bold" width={16} />
                      }
                      onPress={() => handleRoleChange(member.user.id, "admin")}
                    >
                      Change Role
                    </DropdownItem>
                    <DropdownItem
                      key="remove"
                      color="danger"
                      className="text-danger"
                      startContent={
                        <Icon icon="solar:trash-bin-trash-bold" width={16} />
                      }
                      onPress={() => handleRemoveMember(member.user.id)}
                    >
                      Remove Member
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
