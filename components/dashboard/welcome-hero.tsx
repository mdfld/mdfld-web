"use client";

import { useSession } from "@/lib/auth-client";
import { Icon } from "@iconify/react";
import { Button, Modal, ModalContent, useDisclosure } from "@heroui/react";
import { trpc } from "@/lib/trpc-client";
import { useQueryClient } from "@tanstack/react-query";
import OrganizationOnboarding from "./organizations/onboard/organization-onboarding";
import { useRouter } from "next/navigation";

export const WelcomeHero = () => {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const { data: orgs, isLoading: orgsLoading } = trpc.organization.getMyOrganizations.useQuery(
    undefined,
    { enabled: !!session }
  );

  if (isPending || orgsLoading) return null;

  const hasStore = orgs && orgs.length > 0;

  return (
    <>
      <div className="px-4 pt-6 pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Title */}
          <div>
            <p className="text-sm font-medium text-default-500">Welcome back</p>
            <h1 className="text-2xl font-semibold text-foreground truncate max-w-[280px] sm:max-w-none">
              {session?.user.name}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="flat"
              size="sm"
              startContent={<Icon icon="solar:heart-bold" width={16} />}
              onPress={() => router.push("/dashboard/wishlist")}
            >
              Wishlist
            </Button>
            {hasStore ? (
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<Icon icon="solar:add-circle-bold" width={16} />}
                onPress={() => router.push("/dashboard/organization/listings")}
              >
                Add Item
              </Button>
            ) : (
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<Icon icon="solar:shop-bold" width={16} />}
                onPress={onOpen}
              >
                Create Store
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
        classNames={{ base: "max-h-[90vh]", body: "p-0" }}
      >
        <ModalContent>
          {() => (
            <OrganizationOnboarding
              onComplete={() => {
                queryClient.invalidateQueries({ queryKey: ["organization"] });
                onClose();
              }}
            />
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
