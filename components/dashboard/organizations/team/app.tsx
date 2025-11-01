"use client";

import React from "react";
import { trpc } from "@/lib/trpc-client";
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

const roleColors = {
  owner: "danger",
  admin: "warning",
  member: "primary",
} as const;

export default function OrganizationTeamLayout({
  organizationSlug,
}: {
  organizationSlug: string;
}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("member");

  // Fetch organization with members
  const { data, refetch } = trpc.organization.get.useQuery(
    { slug: organizationSlug },
    { enabled: !!organizationSlug },
  );
  const organization = data as any;

  // Invite mutation
  const inviteMember = trpc.organization.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      refetch();
      setInviteEmail("");
      setInviteRole("member");
      onOpenChange();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  // Update member role mutation
  const updateMemberRole = trpc.organization.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success("Member role updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  // Remove member mutation
  const removeMember = trpc.organization.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  const handleInvite = async () => {
    if (!organization?.id || !inviteEmail) return;

    await inviteMember.mutateAsync({
      organizationId: organization.id,
      email: inviteEmail,
      role: inviteRole as any,
    });
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!organization?.id) return;

    await updateMemberRole.mutateAsync({
      organizationId: organization.id,
      memberId: userId,
      role: newRole as any,
    });
  };

  const handleRemoveMember = async (userId: string) => {
    if (!organization?.id) return;

    await removeMember.mutateAsync({
      organizationId: organization.id,
      memberId: userId,
    });
  };

  const columns = [
    { key: "user", label: "USER" },
    { key: "role", label: "ROLE" },
    { key: "joined", label: "JOINED" },
    { key: "actions", label: "ACTIONS" },
  ];

  const renderCell = (member: any, columnKey: any) => {
    switch (columnKey) {
      case "user":
        return (
          <User
            name={member.user.name}
            description={member.user.email}
            avatarProps={{
              src: member.user.image,
              name: member.user.name,
            }}
          />
        );
      case "role":
        return (
          <Chip
            color={roleColors[member.role as keyof typeof roleColors]}
            size="sm"
            variant="flat"
          >
            {member.role}
          </Chip>
        );
      case "joined":
        return (
          <span className="text-small text-default-500">
            {new Date(member.createdAt).toLocaleDateString()}
          </span>
        );
      case "actions":
        const canManage =
          organization?.role === "owner" ||
          (organization?.role === "admin" && member.role !== "owner");

        if (!canManage) return null;

        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <Icon icon="solar:menu-dots-bold" width={20} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Member actions">
              {organization?.role === "owner" && member.role !== "owner" ? (
                <DropdownItem
                  key="role"
                  startContent={<Icon icon="solar:user-id-bold" width={16} />}
                  onPress={() => {
                    const newRole =
                      member.role === "admin" ? "member" : "admin";
                    handleRoleChange(member.userId, newRole);
                  }}
                >
                  Make {member.role === "admin" ? "Member" : "Admin"}
                </DropdownItem>
              ) : null}
              {member.role !== "owner" ? (
                <DropdownItem
                  key="remove"
                  className="text-danger"
                  color="danger"
                  startContent={
                    <Icon icon="solar:trash-bin-2-bold" width={16} />
                  }
                  onPress={() => handleRemoveMember(member.userId)}
                >
                  Remove
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-default-foreground text-3xl leading-9 font-bold">
            Team
          </h1>
          <h2 className="text-small text-default-500 mt-2">
            Manage your organization's team members and their permissions.
          </h2>
        </div>
        {(organization?.role === "owner" || organization?.role === "admin") && (
          <Button
            color="primary"
            onPress={onOpen}
            startContent={<Icon icon="solar:add-circle-bold" width={20} />}
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Members Table */}
      <Table aria-label="Organization members">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={(organization?.members || []) as any}>
          {(member: any) => (
            <TableRow key={member.userId}>
              {(columnKey) => (
                <TableCell>{renderCell(member, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Invite Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Invite Team Member
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Email"
                  placeholder="colleague@example.com"
                  type="email"
                  value={inviteEmail}
                  onValueChange={setInviteEmail}
                />
                <Select
                  label="Role"
                  placeholder="Select a role"
                  selectedKeys={[inviteRole]}
                  onSelectionChange={(keys) =>
                    setInviteRole(Array.from(keys)[0] as string)
                  }
                >
                  <SelectItem key="member">Member</SelectItem>
                  {organization?.role === "owner" ? (
                    <SelectItem key="admin">Admin</SelectItem>
                  ) : null}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleInvite}
                  isLoading={inviteMember.isPending}
                >
                  Send Invitation
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
