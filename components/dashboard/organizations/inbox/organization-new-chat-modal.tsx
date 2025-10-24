"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Avatar,
  Listbox,
  ListboxItem,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";

export type OrganizationNewChatModalProps = {
  isOpen: boolean;
  onOpenChangeAction: () => void;
  organizationId: string;
};

export default function OrganizationNewChatModal({
  isOpen,
  onOpenChangeAction,
  organizationId,
}: OrganizationNewChatModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  // Search for users and organizations
  const { data: searchResults, isLoading } =
    trpc.organization.searchUsersAndOrganizations.useQuery(
      {
        query: searchQuery,
        organizationId,
        limit: 10,
      },
      { enabled: searchQuery.length > 0 && isOpen },
    );

  const users = searchResults?.users || [];
  const organizations = searchResults?.organizations || [];

  // Create conversation mutation
  const createConversation =
    trpc.organization.createOrganizationConversation.useMutation({
      onSuccess: (conversation) => {
        router.push(
          `/dashboard/organization/inbox?conversation=${conversation.id}`,
        );
        onOpenChangeAction();
        resetForm();
      },
    });

  const resetForm = () => {
    setSelectedUser(null);
    setMessage("");
    setSearchQuery("");
  };

  const handleStartChat = async () => {
    if (selectedUser && organizationId) {
      await createConversation.mutateAsync({
        participantIds: [selectedUser],
        organizationId,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChangeAction} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Start New Conversation
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  placeholder="Search users by name or username..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={
                    <Icon icon="solar:magnifer-linear" width={18} />
                  }
                />

                <div className="space-y-2">
                  <p className="text-sm text-default-500">Select a user</p>
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <Spinner size="md" />
                    </div>
                  ) : searchQuery.length === 0 ? (
                    <div className="text-center text-default-400 py-8">
                      Start typing to search for users
                    </div>
                  ) : !searchResults ||
                    (users.length === 0 && organizations.length === 0) ? (
                    <div className="text-center text-default-400 py-8">
                      No users or organizations found
                    </div>
                  ) : (
                    <Listbox
                      aria-label="Select user"
                      selectionMode="single"
                      selectedKeys={selectedUser ? [selectedUser] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setSelectedUser(selected);
                      }}
                      className="max-h-[200px] overflow-auto border border-default-200 rounded-lg"
                    >
                      <>
                        {users.map((user: any) => (
                          <ListboxItem
                            key={user.id}
                            textValue={user.name}
                            className="py-2"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={user.image}
                                name={user.name}
                                size="sm"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {user.name}
                                </p>
                                <p className="text-xs text-default-400">
                                  @{user.username}
                                </p>
                              </div>
                            </div>
                          </ListboxItem>
                        ))}
                        {organizations.length > 0 && users.length > 0 && (
                          <ListboxItem
                            key="divider"
                            className="cursor-default"
                            textValue="Organizations"
                            isReadOnly
                          >
                            <div className="text-xs text-default-400 font-semibold">
                              Organizations
                            </div>
                          </ListboxItem>
                        )}
                        {organizations.map((org: any) => (
                          <ListboxItem
                            key={org.id}
                            textValue={org.name}
                            className="py-2"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={org.logo}
                                name={org.name}
                                size="sm"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {org.name}
                                </p>
                                <p className="text-xs text-default-400">
                                  @{org.slug}
                                </p>
                              </div>
                            </div>
                          </ListboxItem>
                        ))}
                      </>
                    </Listbox>
                  )}
                </div>

                {selectedUser && (
                  <Textarea
                    label="Initial Message (Optional)"
                    placeholder="Type your message..."
                    value={message}
                    onValueChange={setMessage}
                    minRows={3}
                  />
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleStartChat}
                isDisabled={!selectedUser || createConversation.isPending}
                isLoading={createConversation.isPending}
              >
                Start Conversation
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
