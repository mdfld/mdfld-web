"use client";

import React from "react";
import {
	Tab,
	Tabs,
} from "@heroui/react";
import { useSearchParams } from "next/navigation";

import ProfileSetting from "./profile-setting";
import AccountSetting from "./account-setting";
import BillingSetting from "./billing-setting";

export default function SettingsLayout() {
	const searchParams = useSearchParams();
	const tabParam = searchParams.get("tab");
	const validTabs = ["profile", "account", "billing"];
	const defaultTab = validTabs.includes(tabParam ?? "") ? tabParam! : "profile";

	return (
		<div className="flex h-dvh w-full gap-4">
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
					defaultSelectedKey={defaultTab}
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
						<AccountSetting />
					</Tab>
					<Tab key="billing" title="Billing">
						<BillingSetting />
					</Tab>
				</Tabs>
			</div>
		</div>
	);
}
