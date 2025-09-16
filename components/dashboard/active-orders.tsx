"use client";

import { Card, CardHeader, CardFooter, Button, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

const activeOrders = [
	{
		id: "ORD-004",
		product: "Nike Mercurial Superfly",
		image:
			"https://images.unsplash.com/photo-1544966503-7a9ae2e5e3c8?w=400&h=300&fit=crop",
		price: "$299",
		estimatedDelivery: "Tomorrow",
	},
	{
		id: "ORD-005",
		product: "Adidas Predator Jersey",
		image:
			"https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
		price: "$89",
		estimatedDelivery: "Dec 22",
	},
	{
		id: "ORD-006",
		product: "Official FIFA World Cup Ball",
		image:
			"https://images.unsplash.com/photo-1606920420527-f9edf6939e46?w=400&h=300&fit=crop",
		price: "$149",
		estimatedDelivery: "Dec 20",
	},
];

export const ActiveOrders = () => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const currentOrder = activeOrders[currentIndex];

	const nextOrder = () => {
		setCurrentIndex((prev) => (prev + 1) % activeOrders.length);
	};

	const prevOrder = () => {
		setCurrentIndex(
			(prev) => (prev - 1 + activeOrders.length) % activeOrders.length,
		);
	};

	return (
		<div className="space-y-4">
			{/* Navigation Header */}
			<div className="flex justify-between items-center px-2">
				<div>
					<h3 className="text-lg font-semibold">Active Orders</h3>
					<p className="text-small text-default-500">
						{activeOrders.length} orders in progress
					</p>
				</div>
				<div className="flex gap-1">
					<Button
						isIconOnly
						size="sm"
						variant="light"
						onPress={prevOrder}
						aria-label="Previous order"
					>
						<Icon icon="solar:arrow-left-linear" width={16} />
					</Button>
					<Button
						isIconOnly
						size="sm"
						variant="light"
						onPress={nextOrder}
						aria-label="Next order"
					>
						<Icon icon="solar:arrow-right-linear" width={16} />
					</Button>
				</div>
			</div>

			{/* Breathing App Style Card */}
			<Card isFooterBlurred className="w-full h-[320px]">
				<CardHeader className="absolute z-10 top-1 flex-col items-start">
					<p className="text-tiny text-white/60 uppercase font-bold">
						Order {currentOrder.id}
					</p>
					<h4 className="text-white font-medium text-large">
						{currentOrder.product}
					</h4>
				</CardHeader>

				<Image
					removeWrapper
					alt={currentOrder.product}
					className="z-0 w-full h-full object-cover"
					src={currentOrder.image}
				/>

				<CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600">
					<div className="flex grow gap-2 items-center">
						<div className="flex flex-col">
							<span className="inline text-tiny text-white/60">
								Estimated Delivery
							</span>
							<span className="inline text-small text-white font-medium">
								{currentOrder.estimatedDelivery}
							</span>
						</div>
					</div>
					<Button
						radius="md"
						size="sm"
						color="primary"
						startContent={<Icon icon="solar:routing-2-linear" width={16} />}
					>
						Track
					</Button>
				</CardFooter>
			</Card>

			{/* Indicators */}
			<div className="flex justify-center gap-1">
				{activeOrders.map((_, index) => (
					<button
						key={index}
						className={`w-2 h-2 rounded-full transition-colors ${
							index === currentIndex ? "bg-primary" : "bg-default-200"
						}`}
						onClick={() => setCurrentIndex(index)}
					/>
				))}
			</div>
		</div>
	);
};
