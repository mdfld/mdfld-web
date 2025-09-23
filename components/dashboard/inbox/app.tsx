"use client";

import React from "react";
import { Avatar, Button, Spacer, useDisclosure, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { cn } from "@heroui/react";

import MessagingChatInbox from "./messaging-chat-inbox";
import MessagingChatWindow from "./messaging-chat-window";
import MessagingChatProfile from "./messaging-chat-profile";
import MessagingChatHeader from "./messaging-chat-header";

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
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const [isCollapsed, setIsCollapsed] = React.useState(false);
	const {
		isOpen: isProfileSidebarOpen,
		onOpenChange: onProfileSidebarOpenChange,
	} = useDisclosure();

	const isCompact = useMediaQuery("(max-width: 1024px)");
	const isMobile = useMediaQuery("(max-width: 768px)");

	const onToggle = React.useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

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
		let component = <MessagingChatInbox page={page} paginate={paginate} />;

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
				<MessagingChatInbox className="lg:col-span-6 xl:col-span-4" />
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
		<div className="flex h-dvh w-full gap-x-3">
			<main className="w-full">
				<div className="sm:rounded-large grid grid-cols-12 gap-0 overflow-y-hidden p-0 pb-2">
					<MessagingChatHeader
						aria-hidden={!isMobile}
						className="col-span-12 sm:hidden"
						page={page}
						paginate={paginate}
						onOpen={onOpen}
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
	);
}
