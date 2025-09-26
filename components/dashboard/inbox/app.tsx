"use client";

import React from "react";
import { useDisclosure } from "@heroui/react";
import { useMediaQuery } from "usehooks-ts";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { trpc } from "@/lib/trpc-client";

import MessagingChatInbox from "./messaging-chat-inbox";
import MessagingChatWindow from "./messaging-chat-window";
import MessagingChatProfile from "./messaging-chat-profile";
import MessagingChatHeader from "./messaging-chat-header";
import NewChatModal from "./new-chat-modal";

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

/**
 *  This example requires installing the `usehooks-ts` package:
 * `npm install usehooks-ts`
 *
 * import {useMediaQuery} from "usehooks-ts";
 *
 * 💡 TIP: You can use the usePathname hook from Next.js App Router to get the current pathname
 * and use it as the active key for the Sidebar component.
 *
 * ```tsx
 * import {usePathname} from "next/navigation";
 *
 * const pathname = usePathname();
 * const currentPath = pathname.split("/")?.[1]
 *
 * <MessagingSidebar defaultSelectedKey="chat" selectedKeys={[currentPath]} />
 * ```
 */
export default function Component() {
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

  const isCompact = useMediaQuery("(max-width: 1023px)"); // Changed to show compact on md and below
  const isMobile = useMediaQuery("(max-width: 639px)"); // Keep mobile at sm breakpoint

  // Fetch conversations to get the count
  const { data: conversations } = trpc.chat.conversations.useQuery();

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
      <MessagingChatInbox
        page={page}
        paginate={paginate}
        onOpen={onNewChatOpen}
      />
    );

    if (isCompact) {
      switch (page) {
        case 1:
          component = <MessagingChatWindow paginate={paginate} />;
          break;
        case 2:
          component = <MessagingChatProfile paginate={paginate} />;
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
        <MessagingChatInbox
          className="lg:col-span-6 xl:col-span-4"
          onOpen={onNewChatOpen}
        />
        <MessagingChatWindow
          className="lg:col-span-6 xl:col-span-5"
          toggleMessagingProfileSidebar={onProfileSidebarOpenChange}
        />
        <div className="hidden xl:col-span-3 xl:block">
          <MessagingChatProfile />
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
  ]);

  return (
    <>
      <div className="flex h-full w-full gap-x-3">
        <main className="w-full h-full">
          <div className="sm:rounded-large grid grid-cols-12 gap-0 overflow-hidden h-full">
            <MessagingChatHeader
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
      <NewChatModal isOpen={isNewChatOpen} onOpenChange={onNewChatOpenChange} />
    </>
  );
}
