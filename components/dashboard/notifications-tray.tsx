"use client";

import { Card, CardBody, CardHeader, Button, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";

const notifications = [
	{
		id: "N-001",
		type: "order_update",
		title: "Order Shipped",
		message: "Your MacBook Pro has been shipped and is on its way!",
		timestamp: "2 minutes ago",
		icon: "solar:box-linear",
		iconColor: "primary",
		read: false,
		actionable: true,
		actionText: "Track Package",
	},
	{
		id: "N-002",
		type: "price_drop",
		title: "Price Drop Alert",
		message: "AirPods Max dropped to $449 - Save $100!",
		timestamp: "1 hour ago",
		icon: "solar:tag-price-linear",
		iconColor: "success",
		read: false,
		actionable: true,
		actionText: "Buy Now",
	},
	{
		id: "N-003",
		type: "message",
		title: "New Message from Support",
		message: "We've processed your return request for iPhone Case",
		timestamp: "3 hours ago",
		icon: "solar:chat-round-line-linear",
		iconColor: "secondary",
		read: true,
		actionable: true,
		actionText: "View Message",
	},
	{
		id: "N-004",
		type: "promotion",
		title: "Special Offer",
		message: "Get 15% off your next purchase - Limited time!",
		timestamp: "1 day ago",
		icon: "solar:gift-linear",
		iconColor: "warning",
		read: true,
		actionable: true,
		actionText: "Shop Now",
	},
	{
		id: "N-005",
		type: "security",
		title: "Account Security",
		message: "New login detected from Chrome on Mac",
		timestamp: "2 days ago",
		icon: "solar:shield-check-linear",
		iconColor: "danger",
		read: true,
		actionable: false,
		actionText: "",
	},
];

const getTypeIcon = (type: string) => {
	switch (type) {
		case "order_update":
			return "solar:box-linear";
		case "price_drop":
			return "solar:tag-price-linear";
		case "message":
			return "solar:chat-round-line-linear";
		case "promotion":
			return "solar:gift-linear";
		case "security":
			return "solar:shield-check-linear";
		default:
			return "solar:bell-linear";
	}
};

export const NotificationsTray = () => {
	const unreadCount = notifications.filter((n) => !n.read).length;

	return (
		<Card className="w-full">
			<CardHeader className="pb-3">
				<div className="flex justify-between items-center w-full">
					<div className="flex items-center gap-2">
						<h3 className="text-lg font-semibold">Notifications</h3>
						{unreadCount > 0 && (
							<Badge content={unreadCount} color="primary" variant="solid">
								<div></div>
							</Badge>
						)}
					</div>
					<div className="flex gap-2">
						<Button
							variant="light"
							size="sm"
							startContent={<Icon icon="solar:check-read-linear" />}
						>
							Mark All Read
						</Button>
						<Button variant="light" size="sm" isIconOnly aria-label="Settings">
							<Icon icon="solar:settings-linear" width={16} />
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardBody className="gap-1 max-h-[400px] overflow-y-auto">
				{notifications.map((notification) => (
					<div
						key={notification.id}
						className={`relative p-3 rounded-lg border transition-colors cursor-pointer ${
							notification.read
								? "border-transparent hover:border-divider"
								: "border-primary/20 bg-primary/5 hover:bg-primary/10"
						}`}
					>
						{!notification.read && (
							<div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"></div>
						)}

						<div className="flex gap-3">
							<div
								className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-${notification.iconColor}/10`}
							>
								<Icon
									icon={getTypeIcon(notification.type)}
									width={20}
									className={`text-${notification.iconColor}`}
								/>
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex justify-between items-start mb-1">
									<h4
										className={`font-medium ${!notification.read ? "text-foreground" : "text-default-600"}`}
									>
										{notification.title}
									</h4>
									<span className="text-tiny text-default-400 flex-shrink-0 ml-2">
										{notification.timestamp}
									</span>
								</div>

								<p
									className={`text-small ${!notification.read ? "text-default-700" : "text-default-500"} mb-2`}
								>
									{notification.message}
								</p>

								{notification.actionable && (
									<Button
										size="sm"
										variant="flat"
										color={notification.iconColor as any}
										className="mt-2"
									>
										{notification.actionText}
									</Button>
								)}
							</div>
						</div>
					</div>
				))}

				<Button
					variant="light"
					className="w-full mt-2"
					startContent={<Icon icon="solar:history-linear" />}
				>
					View All Notifications
				</Button>
			</CardBody>
		</Card>
	);
};
