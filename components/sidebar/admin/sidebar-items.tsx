import { Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

import { type AdminSidebarItem, AdminSidebarItemType } from "./sidebar";
import TeamAvatar from "./team-avatar";

/**
 * Please check the https://heroui.com/docs/guide/routing to have a seamless router integration
 */

export const adminItems: AdminSidebarItem[] = [
	{
		key: "home",
		href: "/admin",
		icon: "solar:home-2-linear",
		title: "Home",
	},
	{
		key: "settings",
		href: "/admin/settings",
		icon: "solar:add-circle-line-duotone",
		title: "settings",
	},
	{
		key: "team",
		href: "/admin/team",
		icon: "solar:users-group-two-rounded-outline",
		title: "Team",
	},
	{
		key: "reports",
		href: "/admin/reports",
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
];

export const adminSectionItems: AdminSidebarItem[] = [
	{
		key: "admin",
		title: "Admin",
		items: [
			{
				key: "home",
				href: "/admin",
				icon: "solar:home-2-linear",
				title: "Home",
			},
			{
				key: "settings",
				href: "/admin/settings",
				icon: "solar:settings-outline",
				title: "Settings",
			},
			{
				key: "team",
				href: "/admin/team",
				icon: "solar:checklist-minimalistic-outline",
				title: "Orders",
			},
		],
	},
];

export const adminSectionItemsWithTeams: AdminSidebarItem[] = [
	...adminSectionItems,
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

export const adminBrandItems: AdminSidebarItem[] = [
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
			},
			{
				key: "tasks",
				href: "#",
				icon: "solar:checklist-minimalistic-outline",
				title: "Tasks",
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

export const adminSectionLongList: AdminSidebarItem[] = [
	...adminSectionItems,
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

export const adminSectionNestedItems: AdminSidebarItem[] = [
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
		type: AdminSidebarItemType.Nest,
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
