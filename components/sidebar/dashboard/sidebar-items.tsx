import { Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

import { type SidebarItem, SidebarItemType } from "./sidebar";
import TeamAvatar from "./team-avatar";

/**
 * Please check the https://heroui.com/docs/guide/routing to have a seamless router integration
 */

export const items: SidebarItem[] = [
	{
		key: "home",
		href: "/dashboard",
		icon: "solar:home-2-linear",
		title: "Home",
	},
	{
		key: "settings",
		href: "/dashboard/settings",
		icon: "solar:add-circle-line-duotone",
		title: "settings",
	},
	{
		key: "team",
		href: "#",
		icon: "solar:users-group-two-rounded-outline",
		title: "Team",
	},
	{
		key: "tracker",
		href: "#",
		icon: "solar:sort-by-time-linear",
		title: "Tracker",
		endContent: (
			<Chip size="sm" variant="flat">
				New
			</Chip>
		),
	},
	{
		key: "orders",
		href: "/orders",
		icon: "solar:chart-outline",
		title: "Orders",
	},
	{
		key: "perks",
		href: "#",
		icon: "solar:gift-linear",
		title: "Perks",
		endContent: (
			<Chip size="sm" variant="flat">
				3
			</Chip>
		),
	},
	{
		key: "expenses",
		href: "#",
		icon: "solar:bill-list-outline",
		title: "Expenses",
	},
	{
		key: "settings",
		href: "#",
		icon: "solar:settings-outline",
		title: "Settings",
	},
];

export const sectionItems: SidebarItem[] = [
	{
		key: "overview",
		title: "Overview",
		items: [
			{
				key: "home",
				href: "/dashboard",
				icon: "solar:home-2-linear",
				title: "Home",
			},
			{
				key: "settings",
				href: "/dashboard/settings",
				icon: "solar:settings-outline",
				title: "Settings",
			},
			{
				key: "orders",
				href: "/dashboard/orders",
				icon: "solar:checklist-minimalistic-outline",
				title: "Orders",
			},
			{
				key: "inbox",
				href: "/dashboard/inbox",
				icon: "solar:chat-round-dots-linear",
				title: "Inbox",
			},
			{
				key: "wishlist",
				href: "/dashboard/wishlist",
				icon: "solar:heart-outline",
				title: "Saved Items",
			},
			{
				key: "returns",
				href: "/dashboard/returns",
				icon: "solar:rewind-back-outline",
				title: "Returns",
			},
		],
	},
	{
		key: "organization",
		title: "Store",
		items: [
			{
				key: "listings",
				href: "/dashboard/organization/listings",
				title: "My Listings",
				icon: "solar:widget-2-outline",
			},
			{
				key: "org-orders",
				href: "/dashboard/organization/orders",
				icon: "solar:bag-smile-outline",
				title: "Orders",
			},
			{
				key: "team",
				href: "/dashboard/organization/team",
				icon: "solar:users-group-two-rounded-outline",
				title: "Team",
			},
			{
				key: "org-inbox",
				href: "/dashboard/organization/inbox",
				icon: "solar:chat-round-dots-linear",
				title: "Inbox",
			},
			{
				key: "connect",
				href: "/dashboard/connect",
				icon: "solar:card-outline",
				title: "Stripe",
			},

			{
				key: "org-settings",
				href: "/dashboard/organization/settings",
				icon: "solar:settings-outline",
				title: "Settings",
			},
		],
	},
];

export const sectionItemsWithTeams: SidebarItem[] = [
	...sectionItems,
	{
		key: "your-teams",
		title: "Your Teams",
		items: [
			{
				key: "mdfld",
				href: "#",
				title: "MDFLD",
				startContent: <TeamAvatar name="Midfield" />,
			},
		],
	},
];

export const brandItems: SidebarItem[] = [
	{
		key: "overview",
		title: "Overview",
		items: [
			{
				key: "home",
				href: "#",
				icon: "solar:home-2-linear",
				title: "Home",
			},
			{
				key: "projects",
				href: "#",
				icon: "solar:widget-2-outline",
				title: "Projects",
				endContent: (
					<Icon
						className="text-primary-foreground/60"
						icon="solar:add-circle-line-duotone"
						width={24}
					/>
				),
			},
			{
				key: "tasks",
				href: "#",
				icon: "solar:checklist-minimalistic-outline",
				title: "Tasks",
				endContent: (
					<Icon
						className="text-primary-foreground/60"
						icon="solar:add-circle-line-duotone"
						width={24}
					/>
				),
			},
			{
				key: "team",
				href: "#",
				icon: "solar:users-group-two-rounded-outline",
				title: "Team",
			},
			{
				key: "tracker",
				href: "#",
				icon: "solar:sort-by-time-linear",
				title: "Tracker",
				endContent: (
					<Chip
						className="bg-primary-foreground text-primary font-medium"
						size="sm"
						variant="flat"
					>
						New
					</Chip>
				),
			},
		],
	},
	{
		key: "your-teams",
		title: "Your Teams",
		items: [
			{
				key: "heroui",
				href: "#",
				title: "HeroUI",
				startContent: (
					<TeamAvatar
						classNames={{
							base: "border-1 border-primary-foreground/20",
							name: "text-primary-foreground/80",
						}}
						name="Hero UI"
					/>
				),
			},
		],
	},
];

export const sectionLongList: SidebarItem[] = [
	...sectionItems,
	{
		key: "payments",
		title: "Payments",
		items: [
			{
				key: "payroll",
				href: "#",
				title: "Payroll",
				icon: "solar:dollar-minimalistic-linear",
			},
			{
				key: "invoices",
				href: "#",
				title: "Invoices",
				icon: "solar:file-text-linear",
			},
			{
				key: "billing",
				href: "#",
				title: "Billing",
				icon: "solar:card-outline",
			},
			{
				key: "payment-methods",
				href: "#",
				title: "Payment Methods",
				icon: "solar:wallet-money-outline",
			},
			{
				key: "payouts",
				href: "#",
				title: "Payouts",
				icon: "solar:card-transfer-outline",
			},
		],
	},
	{
		key: "your-teams",
		title: "Your Teams",
		items: [
			{
				key: "heroui",
				href: "#",
				title: "HeroUI",
				startContent: <TeamAvatar name="Hero UI" />,
			},
		],
	},
];

export const sectionNestedItems: SidebarItem[] = [
	{
		key: "home",
		href: "#",
		icon: "solar:home-2-linear",
		title: "Home",
	},
	{
		key: "projects",
		href: "#",
		icon: "solar:widget-2-outline",
		title: "Projects",
		endContent: (
			<Icon
				className="text-default-400"
				icon="solar:add-circle-line-duotone"
				width={24}
			/>
		),
	},
	{
		key: "tasks",
		href: "#",
		icon: "solar:checklist-minimalistic-outline",
		title: "Tasks",
		endContent: (
			<Icon
				className="text-default-400"
				icon="solar:add-circle-line-duotone"
				width={24}
			/>
		),
	},
	{
		key: "team",
		href: "#",
		icon: "solar:users-group-two-rounded-outline",
		title: "Team",
	},
	{
		key: "tracker",
		href: "#",
		icon: "solar:sort-by-time-linear",
		title: "Tracker",
		endContent: (
			<Chip size="sm" variant="flat">
				New
			</Chip>
		),
	},
	{
		key: "analytics",
		href: "#",
		icon: "solar:chart-outline",
		title: "Analytics",
	},
	{
		key: "perks",
		href: "#",
		icon: "solar:gift-linear",
		title: "Perks",
		endContent: (
			<Chip size="sm" variant="flat">
				3
			</Chip>
		),
	},
	{
		key: "cap_table",
		title: "Cap Table",
		icon: "solar:pie-chart-2-outline",
		type: SidebarItemType.Nest,
		items: [
			{
				key: "shareholders",
				icon: "solar:users-group-rounded-linear",
				href: "#",
				title: "Shareholders",
			},
			{
				key: "note_holders",
				icon: "solar:notes-outline",
				href: "#",
				title: "Note Holders",
			},
			{
				key: "transactions_log",
				icon: "solar:clipboard-list-linear",
				href: "#",
				title: "Transactions Log",
			},
		],
	},
	{
		key: "expenses",
		href: "#",
		icon: "solar:bill-list-outline",
		title: "Expenses",
	},
];
