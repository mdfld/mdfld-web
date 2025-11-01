"use client";

import React, { useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Avatar,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { useRouter } from "next/navigation";
import { useDebounceValue } from "usehooks-ts";

interface NewChatModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewChatModal({
  isOpen,
  onOpenChange,
}: NewChatModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [debouncedQuery] = useDebounceValue(searchQuery, 300);

  // Search users
  const { data: searchResults, isLoading: isSearching } =
    trpc.user.search.useQuery(
      {
        query: debouncedQuery,
        limit: 10,
        excludeIds: selectedUsers,
      },
      {
        enabled: debouncedQuery.length > 0,
      },
    );

  // Create conversation mutation
  const createConversationMutation = trpc.chat.createConversation.useMutation({
    onSuccess: (conversation) => {
      // Navigate to the new conversation
      router.push(`/dashboard/inbox?conversation=${conversation.id}`);
      onOpenChange(false);
      setSearchQuery("");
      setSelectedUsers([]);
    },
  });

  const handleCreateChat = useCallback(
    async (userId: string) => {
      await createConversationMutation.mutateAsync({
        participantIds: [userId],
        type: "DIRECT",
      });
    },
    [createConversationMutation],
  );

  const handleCreateGroupChat = useCallback(async () => {
    if (selectedUsers.length < 2) return;

    await createConversationMutation.mutateAsync({
      participantIds: selectedUsers,
      type: "GROUP",
    });
  }, [selectedUsers, createConversationMutation]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">New Message</h3>
              <p className="text-sm text-default-500">
                Search for users by email or username
              </p>
            </ModalHeader>
            <ModalBody className="pb-6">
              <Input
                autoFocus
                placeholder="Search users..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={
                  <Icon
                    icon="solar:magnifer-linear"
                    className="text-default-400"
                    width={20}
                  />
                }
                endContent={isSearching && <Spinner size="sm" />}
              />

              {/* Selected users for group chat */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <p className="text-sm text-default-500 w-full">
                    Selected users ({selectedUsers.length}):
                  </p>
                  <Button
                    size="sm"
                    color="primary"
                    onClick={handleCreateGroupChat}
                    isLoading={createConversationMutation.isPending}
                  >
                    Create Group Chat
                  </Button>
                </div>
              )}

              {/* Search results */}
              <div className="mt-4 space-y-2">
                {searchResults?.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-default-100 cursor-pointer transition-colors"
                    onClick={() => handleCreateChat(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.image || undefined}
                        name={user.name}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-default-500">
                          @{user.username} · {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      isIconOnly
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedUsers.includes(user.id)) {
                          setSelectedUsers((prev) =>
                            prev.filter((id) => id !== user.id),
                          );
                        } else {
                          setSelectedUsers((prev) => [...prev, user.id]);
                        }
                      }}
                    >
                      <Icon
                        icon={
                          selectedUsers.includes(user.id)
                            ? "solar:check-circle-bold"
                            : "solar:add-circle-linear"
                        }
                        width={18}
                      />
                    </Button>
                  </div>
                ))}

                {searchQuery && searchResults?.length === 0 && !isSearching && (
                  <div className="text-center py-8 text-default-500">
                    No users found
                  </div>
                )}

                {!searchQuery && (
                  <div className="text-center py-8 text-default-500">
                    Start typing to search for users
                  </div>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
