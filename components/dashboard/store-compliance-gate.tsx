"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Avatar,
  Card,
  CardBody,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc-client";
import { useOrganizationStore } from "@/lib/stores/organization";
import { toast } from "sonner";

export default function StoreComplianceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: organizations, isLoading, refetch } =
    trpc.organization.getMyOrganizations.useQuery() as any;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const setActiveOrganization = useOrganizationStore(
    (state) => state.setActiveOrganization,
  );

  const deleteOrg = trpc.organization.delete.useMutation();

  if (isLoading) return null;

  const ownedOrgs = (organizations ?? []).filter(
    (org: any) => org.role === "owner",
  );

  if (ownedOrgs.length <= 1) return <>{children}</>;

  const activeSelectedId = selectedId ?? ownedOrgs[0].id;

  const handleConfirm = async () => {
    const toDelete = ownedOrgs.filter(
      (org: any) => org.id !== activeSelectedId,
    );
    setIsDeleting(true);
    try {
      await Promise.all(
        toDelete.map((org: any) =>
          deleteOrg.mutateAsync({ id: org.id }),
        ),
      );
      const kept = ownedOrgs.find((org: any) => org.id === activeSelectedId);
      if (kept) {
        setActiveOrganization({
          id: kept.id,
          name: kept.name,
          slug: kept.slug,
          role: kept.role,
        });
      }
      await refetch();
      toast.success("Store selection saved.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen
        isDismissable={false}
        hideCloseButton
        size="md"
        classNames={{ backdrop: "bg-black/80" }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:danger-triangle-bold"
                className="text-warning"
                width={22}
              />
              Choose your store
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-500 mb-3">
              MDFLD now allows one store per account. You have{" "}
              {ownedOrgs.length} stores. Choose the one you want to keep. The
              rest will be permanently deleted, including all their listings.
            </p>
            <div className="flex flex-col gap-2">
              {ownedOrgs.map((org: any) => {
                const isSelected = org.id === activeSelectedId;
                return (
                  <Card
                    key={org.id}
                    isPressable
                    onPress={() => setSelectedId(org.id)}
                    className={`border-2 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-default-200 bg-default-50"
                    }`}
                    shadow="none"
                  >
                    <CardBody className="flex flex-row items-center gap-3 py-3">
                      <Avatar
                        src={org.logo || undefined}
                        name={org.name}
                        size="sm"
                        radius="full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {org.name}
                        </p>
                        <p className="text-xs text-default-400">
                          @{org.slug}
                        </p>
                      </div>
                      {isSelected && (
                        <Icon
                          icon="solar:check-circle-bold"
                          className="text-primary flex-shrink-0"
                          width={20}
                        />
                      )}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
            <div className="mt-2 rounded-lg bg-danger/10 border border-danger/20 p-3">
              <p className="text-xs text-danger">
                This cannot be undone. All products and data in the deleted
                stores will be permanently removed.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              isLoading={isDeleting}
              isDisabled={!activeSelectedId}
              onPress={handleConfirm}
              className="w-full"
            >
              Keep this store and delete the rest
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {children}
    </>
  );
}
