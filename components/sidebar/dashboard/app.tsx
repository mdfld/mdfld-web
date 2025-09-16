"use client";

import React from "react";
import { Avatar, Button, ScrollShadow, Spacer, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@heroui/react";
import Image from "next/image";
import Sidebar from "./sidebar";
import { useSession } from "@/lib/auth-client";

import { sectionItemsWithTeams } from "./sidebar-items";

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
 * <Sidebar defaultSelectedKey="home" selectedKeys={[currentPath]} />
 * ```
 */
export default function SidebarWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	const isCompact = useMediaQuery("(max-width: 768px)");

	const { data: session, isPending } = useSession();

	if (isPending) return null;

	return (
		<div className="flex h-dvh w-full">
			<div
				className={cn(
					"border-r-small! border-divider transition-width relative flex h-full w-72 flex-col p-6",
					{
						"w-16 items-center px-2 py-6": isCompact,
					},
				)}
			>
				<div className="text-background justify-center rounded-full">
					<Image
						src="https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjlsYla8wKE2TjwSU8x3apY10zR5NV9ighPDtr"
						alt="mdfld logo"
						width={100}
						height={10}
						className="flex bg-transparent"
					></Image>
				</div>
				<Spacer y={8} />
				<div className="flex items-center gap-3 px-3">
					<Avatar
						isBordered
						className="flex-none"
						size="sm"
						src="https://i.pravatar.cc/150?u=a04258114e29026708c"
					/>
					<div
						className={cn("flex max-w-full flex-col", { hidden: isCompact })}
					>
						<p className="text-small text-default-600 truncate font-medium">
							John Doe
						</p>
						<p className="text-tiny text-default-400 truncate">
							Product Designer
						</p>
					</div>
				</div>
				<ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
					<Sidebar
						defaultSelectedKey="home"
						isCompact={isCompact}
						items={sectionItemsWithTeams}
					/>
				</ScrollShadow>
				<Spacer y={2} />
				<div
					className={cn("mt-auto flex flex-col", {
						"items-center": isCompact,
					})}
				>
					<Tooltip
						content="Admin Access"
						isDisabled={!isCompact}
						placement="right"
					>
						<Button
							fullWidth
							className={cn(
								"text-default-500 data-[hover=true]:text-foreground justify-start truncate",
								{
									"justify-center": isCompact,
								},
							)}
							isIconOnly={isCompact}
							startContent={
								isCompact ? null : (
									<Icon
										className="text-default-500 flex-none"
										icon="solar:info-circle-line-duotone"
										width={24}
									/>
								)
							}
							variant="light"
						>
							{isCompact ? (
								<Icon
									className="text-default-500"
									icon="solar:info-circle-line-duotone"
									width={24}
								/>
							) : (
								"Admin Access"
							)}
						</Button>
					</Tooltip>
					<Tooltip
						content="Help & Feedback"
						isDisabled={!isCompact}
						placement="right"
					>
						<Button
							fullWidth
							className={cn(
								"text-default-500 data-[hover=true]:text-foreground justify-start truncate",
								{
									"justify-center": isCompact,
								},
							)}
							isIconOnly={isCompact}
							startContent={
								isCompact ? null : (
									<Icon
										className="text-default-500 flex-none"
										icon="solar:info-circle-line-duotone"
										width={24}
									/>
								)
							}
							variant="light"
						>
							{isCompact ? (
								<Icon
									className="text-default-500"
									icon="solar:info-circle-line-duotone"
									width={24}
								/>
							) : (
								"Help & Information"
							)}
						</Button>
					</Tooltip>
					<Tooltip content="Log Out" isDisabled={!isCompact} placement="right">
						<Button
							className={cn(
								"text-default-500 data-[hover=true]:text-foreground justify-start",
								{
									"justify-center": isCompact,
								},
							)}
							isIconOnly={isCompact}
							startContent={
								isCompact ? null : (
									<Icon
										className="text-default-500 flex-none rotate-180"
										icon="solar:minus-circle-line-duotone"
										width={24}
									/>
								)
							}
							variant="light"
						>
							{isCompact ? (
								<Icon
									className="text-default-500 rotate-180"
									icon="solar:minus-circle-line-duotone"
									width={24}
								/>
							) : (
								"Log Out"
							)}
						</Button>
					</Tooltip>
				</div>
			</div>
			<div className="w-full flex-1 flex-col p-4">
				<main className="border-small border-divider flex flex-col rounded-medium h-full w-full overflow-visible">
					{children}
				</main>
			</div>
		</div>
	);
}
