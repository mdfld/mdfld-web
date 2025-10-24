"use client";

import React from "react";
import { useDisclosure } from "@heroui/react";
import { useMediaQuery } from "usehooks-ts";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { trpc } from "@/lib/trpc-client";

import OrganizationChatInbox from "./organization-chat-inbox";
import OrganizationChatWindow from "./organization-chat-window";
import OrganizationChatProfile from "./organization-chat-profile";
import OrganizationChatHeader from "./organization-chat-header";
import OrganizationNewChatModal from "./organization-new-chat-modal";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 20 : -20,
    opacity: 0,
  }),
};

export default function OrganizationInboxLayout({
  organizationId,
}: {
  organizationId?: string;
}) {
  const [[page, direction], setPage] = React.useState([0, 0]);

  const {
    isOpen: isProfileSidebarOpen,
    onOpenChange: onProfileSidebarOpenChange,
  } = useDisclosure();

  const {
    isOpen: isNewChatOpen,
    onOpen: onNewChatOpen,
    onOpenChange: onNewChatOpenChange,
  } = useDisclosure();

  const isCompact = useMediaQuery("(max-width: 1023px)");
  const isMobile = useMediaQuery("(max-width: 639px)");

  // Use provided organizationId or fallback to first org
  const { data: orgs } = trpc.organization.getMyOrganizations.useQuery();
  const effectiveOrganizationId = organizationId || orgs?.[0]?.id || "";

  // Fetch real conversations
  const { data: conversations = [] } = trpc.chat.conversations.useQuery();

  const paginate = React.useCallback(
    (newDirection: number) => {
      setPage((prev) => {
        if (!isCompact) return prev;

        const currentPage = prev[0];

        if (currentPage < 0 || currentPage > 2) return [currentPage, prev[1]];

        return [currentPage + newDirection, newDirection];
      });
    },
    [isCompact],
  );

  const content = React.useMemo(() => {
    let component = (
      <OrganizationChatInbox
        page={page}
        paginate={paginate}
        onOpen={onNewChatOpen}
        organizationId={effectiveOrganizationId}
      />
    );

    if (isCompact) {
      switch (page) {
        case 1:
          component = <OrganizationChatWindow paginate={paginate} />;
          break;
        case 2:
          component = <OrganizationChatProfile paginate={paginate} />;
          break;
      }

      return (
        <LazyMotion features={domAnimation}>
          <m.div
            key={page}
            animate="center"
            className="col-span-12"
            custom={direction}
            exit="exit"
            initial="enter"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            variants={variants}
          >
            {component}
          </m.div>
        </LazyMotion>
      );
    }

    return (
      <>
        <OrganizationChatInbox
          className="lg:col-span-6 xl:col-span-4"
          onOpen={onNewChatOpen}
          organizationId={effectiveOrganizationId}
        />
        <OrganizationChatWindow
          className="lg:col-span-6 xl:col-span-5"
          toggleMessagingProfileSidebar={onProfileSidebarOpenChange}
        />
        <div className="hidden xl:col-span-3 xl:block">
          <OrganizationChatProfile />
        </div>
      </>
    );
  }, [
    isCompact,
    page,
    paginate,
    direction,
    isProfileSidebarOpen,
    onProfileSidebarOpenChange,
    onNewChatOpen,
    effectiveOrganizationId,
  ]);

  return (
    <>
      <div className="flex h-full w-full gap-x-3">
        <main className="w-full h-full">
          <div className="sm:rounded-large grid grid-cols-12 gap-0 overflow-hidden h-full">
            <OrganizationChatHeader
              aria-hidden={!isMobile}
              className="col-span-12 sm:hidden"
              page={page}
              paginate={paginate}
              onOpen={onNewChatOpen}
              chatCount={conversations?.length || 0}
            />
            {isCompact ? (
              <AnimatePresence custom={direction} initial={false} mode="wait">
                {content}
              </AnimatePresence>
            ) : (
              content
            )}
          </div>
        </main>
      </div>
      <OrganizationNewChatModal
        isOpen={isNewChatOpen}
        onOpenChangeAction={onNewChatOpenChange}
        organizationId={effectiveOrganizationId}
      />
    </>
  );
}
