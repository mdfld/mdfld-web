"use client";

import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownSection,
	DropdownItem,
	User,
	Button,
	Avatar,
	Tooltip,
} from "@heroui/react";
import { useSession } from "@/lib/auth-client";

interface UserSwitcherProps {
	isCompact?: boolean;
}

export default function UserSwitcher({ isCompact = false }: UserSwitcherProps) {
	const { data: session, isPending } = useSession();

	if (isPending) return null;

	return (
		<div className="flex items-center gap-4">
			<Dropdown placement="bottom-start">
				<DropdownTrigger>
					{isCompact ? (
						<Avatar
							as="button"
							isBordered
							src={session?.user.image || undefined}
							name={session?.user.image ? undefined : "MD"}
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
								name: session?.user.image ? undefined : "MD",
								radius: "lg",
								className: "mx-1",
							}}
							className="transition-transform"
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
					<DropdownSection>
						<DropdownItem key="public-profile">Public Profile</DropdownItem>
						<DropdownItem key="logout">Logout</DropdownItem>
					</DropdownSection>
				</DropdownMenu>
			</Dropdown>
		</div>
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
