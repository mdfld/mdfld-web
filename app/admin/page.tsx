"use client";

import AdminBannerCards from "@/components/admin/admin-meta-cards/page";
import UserCount from "@/components/admin/users";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

const adminSections = [
	{
		title: "Platform Analytics",
		description:
			"View user counts, organization metrics, and platform statistics",
		icon: "solar:chart-line-duotone",
		href: "/admin/analytics",
		color: "primary",
	},
	{
		title: "Content Moderation",
		description: "Review and moderate user-generated content",
		icon: "solar:shield-check-bold-duotone",
		href: "/admin/moderation",
		color: "warning",
	},
	{
		title: "Admin Settings",
		description: "Configure platform settings and features",
		icon: "solar:settings-bold-duotone",
		href: "/admin/settings",
		color: "secondary",
	},
];

export default function AdminDashboard() {
	return (
		<div className="p-6">
			<AdminBannerCards></AdminBannerCards>
		</div>
	);
}
