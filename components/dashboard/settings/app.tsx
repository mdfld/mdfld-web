"use client";

import React from "react";
import {
	Avatar,
	Button,
	Spacer,
	Tab,
	Tabs,
	Tooltip,
	useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@heroui/react";

import ProfileSetting from "./profile-setting";
import AccountSetting from "./account-setting";
import BillingSetting from "./billing-setting";

/**
 * This example requires installing the `usehooks-ts` and `lodash` packages.
 * `npm install usehooks-ts lodash`
 *
 * import {useMediaQuery} from "usehooks-ts";
 * import {isEqual, uniqWith} from "lodash";
 *
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
export default function SettingsLayout() {
	const { isOpen, onOpenChange } = useDisclosure();
	const [isCollapsed, setIsCollapsed] = React.useState(false);
	const isMobile = useMediaQuery("(max-width: 768px)");

	const onToggle = React.useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	return (
		<div className="flex h-dvh w-full gap-4">
			{/* Sidebar */}

			{/*  Settings Content */}
			<div className="w-full max-w-2xl flex-1 p-4">
				{/* Title */}
				<div className="flex items-center gap-x-3">
					<h1 className="text-default-foreground text-3xl leading-9 font-bold">
						Settings
					</h1>
				</div>
				<h2 className="text-small text-default-500 mt-2">
					Customize settings, email preferences, and web appearance.
				</h2>
				{/*  Tabs */}
				<Tabs
					fullWidth
					classNames={{
						base: "mt-6",
						cursor: "bg-content1 dark:bg-content1",
						panel: "w-full p-0 pt-4",
					}}
				>
					<Tab key="profile" title="Profile">
						<ProfileSetting />
					</Tab>
					<Tab key="account" title="Account">
						<AccountSetting></AccountSetting>
					</Tab>
					<Tab key="billing" title="Billing">
						<BillingSetting></BillingSetting>
					</Tab>
				</Tabs>
			</div>
		</div>
	);
}
