"use client";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  User,
  Button,
  useDisclosure,
  Modal,
  ModalContent,
} from "@heroui/react";
import UserAvatar from "@/components/common/user-avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc-client";
import { Icon } from "@iconify/react";

import OrganizationOnboarding from "./organizations/onboard/organization-onboarding";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizationStore } from "@/lib/stores/organization";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserSwitcherProps {
  isCompact?: boolean;
}

export default function UserSwitcher({ isCompact = false }: UserSwitcherProps) {
  const { data: session, isPending } = useSession();
  const { data: organizations } =
    trpc.organization.getMyOrganizations.useQuery() as any;
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const router = useRouter();

  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );
  const setActiveOrganization = useOrganizationStore(
    (state) => state.setActiveOrganization,
  );

  // Set the first organization as active if none is selected
  useEffect(() => {
    if (organizations && organizations.length > 0 && !activeOrganization) {
      const firstOrg = organizations[0];
      setActiveOrganization({
        id: firstOrg.id,
        name: firstOrg.name,
        slug: firstOrg.slug,
        role: firstOrg.role,
      });
    }
  }, [organizations, activeOrganization, setActiveOrganization]);

  if (isPending) return null;

  const handleOrganizationSelect = (org: any) => {
    setActiveOrganization({
      id: org.id,
      name: org.name,
      slug: org.slug,
      role: org.role,
    });
  };

  const handleCreateOrganization = () => {
    onOpen();
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Dropdown placement="bottom-start">
          <DropdownTrigger>
            {isCompact ? (
              <UserAvatar
                as="button"
                isBordered
                src={session?.user.image}
                name={session?.user.name || "MD"}
                radius="lg"
                className="mx-1 transition-transform"
                size="md"
              />
            ) : (
              <User
                as="button"
                avatarProps={{
                  isBordered: true,
                  src: session?.user.image || undefined,
                  name: session?.user.name || "MD",
                  radius: "lg",
                }}
                className="gap-3 transition-transform"
                description={`@${session?.user.username || "user"}`}
                name={session?.user.name || "User"}
              />
            )}
          </DropdownTrigger>
          <DropdownMenu aria-label="User Actions" variant="flat">
            <DropdownSection showDivider>
              <DropdownItem
                key="profile"
                className="h-14 gap-2"
                textValue="Profile"
                isReadOnly
              >
                <User
                  as="button"
                  avatarProps={{
                    src: session?.user.image || undefined,
                    name: session?.user.image ? undefined : "MD",
                    radius: "full",
                    className: "",
                    size: "sm",
                  }}
                  className="transition-transform"
                  description={`@${session?.user.username || "user"}`}
                  name={session?.user.name || "User"}
                />
              </DropdownItem>
            </DropdownSection>

            <DropdownSection title="STORES" showDivider>
              {organizations && organizations.length > 0 ? (
                <>
                  {organizations.map((org: any) => (
                    <DropdownItem
                      key={org.id}
                      onClick={() => handleOrganizationSelect(org)}
                      startContent={
                        activeOrganization?.id === org.id ? (
                          <Icon
                            icon="solar:arrow-right-linear"
                            className="text-default-500"
                            width={16}
                          />
                        ) : (
                          <div className="w-4" />
                        )
                      }
                    >
                      {org.name}
                    </DropdownItem>
                  ))}
                  <DropdownItem
                    key="create-org"
                    onClick={handleCreateOrganization}
                    startContent={<PlusIcon className="text-default-500" />}
                    className="text-primary"
                  >
                    Create Store
                  </DropdownItem>
                </>
              ) : (
                <DropdownItem
                  key="create-org"
                  onClick={handleCreateOrganization}
                  startContent={<PlusIcon className="text-default-500" />}
                  className="text-primary"
                >
                  Create Store
                </DropdownItem>
              )}
            </DropdownSection>

            <DropdownSection>
              <DropdownItem
                key="public-profile"
                onClick={() => {
                  if (session?.user.username) {
                    router.push(`/users/${session.user.username}`);
                  }
                }}
              >
                Public Profile
              </DropdownItem>
              {activeOrganization && (
                <DropdownItem
                  key="public-store"
                  onClick={() => {
                    router.push(`/orgs/${activeOrganization.slug}`);
                  }}
                >
                  Public Store
                </DropdownItem>
              )}
              <DropdownItem key="settings" href="/dashboard/settings">
                Settings
              </DropdownItem>
              <DropdownItem
                key="logout"
                onClick={async () => {
                  await signOut();
                  router.push("/auth/login");
                }}
              >
                Logout
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "p-0",
        }}
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
}

export const PlusIcon = (props: any) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="1em"
      role="presentation"
      viewBox="0 0 24 24"
      width="1em"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      >
        <path d="M6 12h12" />
        <path d="M12 18V6" />
      </g>
    </svg>
  );
};

export function UserTrigger() {
  return (
    <Dropdown
      showArrow
      classNames={{
        base: "before:bg-default-200",
        content: "p-0 border-small border-divider bg-background",
      }}
      radius="sm"
    >
      <DropdownTrigger>
        <Button disableRipple variant="ghost">
          Open Menu
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Custom item styles"
        className="p-3"
        disabledKeys={["profile"]}
        itemClasses={{
          base: [
            "rounded-md",
            "text-default-500",
            "transition-opacity",
            "data-[hover=true]:text-foreground",
            "data-[hover=true]:bg-default-100",
            "dark:data-[hover=true]:bg-default-50",
            "data-[selectable=true]:focus:bg-default-50",
            "data-[pressed=true]:opacity-70",
            "data-[focus-visible=true]:ring-default-500",
          ],
        }}
      >
        <DropdownSection showDivider aria-label="Profile & Actions">
          <DropdownItem
            key="profile"
            isReadOnly
            className="h-14 gap-2 opacity-100"
          >
            <User
              avatarProps={{
                size: "sm",
                src: "https://avatars.githubusercontent.com/u/30373425?v=4",
              }}
              classNames={{
                name: "text-default-600",
                description: "text-default-500",
              }}
              description="@jrgarciadev"
              name="Junior Garcia"
            />
          </DropdownItem>
          <DropdownItem key="dashboard">Dashboard</DropdownItem>
          <DropdownItem key="settings">Settings</DropdownItem>
          <DropdownItem
            key="new_project"
            endContent={<PlusIcon className="text-large" />}
          >
            New Project
          </DropdownItem>
        </DropdownSection>

        <DropdownSection showDivider aria-label="Preferences">
          <DropdownItem key="quick_search" shortcut="⌘K">
            Quick search
          </DropdownItem>
          <DropdownItem
            key="theme"
            isReadOnly
            className="cursor-default"
            endContent={
              <select
                className="z-10 outline-solid outline-transparent w-16 py-0.5 rounded-md text-tiny group-data-[hover=true]:border-default-500 border-small border-default-300 dark:border-default-200 bg-transparent text-default-500"
                id="theme"
                name="theme"
              >
                <option>System</option>
                <option>Dark</option>
                <option>Light</option>
              </select>
            }
          >
            Theme
          </DropdownItem>
        </DropdownSection>

        <DropdownSection aria-label="Help & Feedback">
          <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
          <DropdownItem key="logout">Log Out</DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
