"use client";

import { Card, CardHeader, CardFooter, Button, Image } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState } from "react";

const wishlistItems = [
	{
		id: "WL-001",
		product: "Nike Air Zoom Mercurial",
		image:
			"https://images.unsplash.com/photo-1544966503-7a9ae2e5e3c8?w=400&h=300&fit=crop",
		price: "$329",
		originalPrice: "$399",
		discount: "18% off",
	},
	{
		id: "WL-002",
		product: "Manchester United Jersey",
		image:
			"https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop",
		price: "$79",
		originalPrice: "$99",
		discount: "20% off",
	},
	{
		id: "WL-003",
		product: "Professional Soccer Ball",
		image:
			"https://images.unsplash.com/photo-1606920420527-f9edf6939e46?w=400&h=300&fit=crop",
		price: "$89",
		originalPrice: "$120",
		discount: "26% off",
	},
];

export const WishlistSpotlight = () => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const currentItem = wishlistItems[currentIndex];

	const nextItem = () => {
		setCurrentIndex((prev) => (prev + 1) % wishlistItems.length);
	};

	const prevItem = () => {
		setCurrentIndex(
			(prev) => (prev - 1 + wishlistItems.length) % wishlistItems.length,
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center px-2">
				<div>
					<h3 className="text-lg font-semibold">Wishlist Spotlight</h3>
					<p className="text-small text-default-500">
						{wishlistItems.length} items saved
					</p>
				</div>
				<div className="flex gap-1">
					<Button
						isIconOnly
						size="sm"
						variant="light"
						onPress={prevItem}
						aria-label="Previous item"
					>
						<Icon icon="solar:arrow-left-linear" width={16} />
					</Button>
					<Button
						isIconOnly
						size="sm"
						variant="light"
						onPress={nextItem}
						aria-label="Next item"
					>
						<Icon icon="solar:arrow-right-linear" width={16} />
					</Button>
				</div>
			</div>

			<Card isFooterBlurred className="w-full h-[320px]">
				<CardHeader className="absolute z-10 top-1 flex-col items-start">
					<p className="text-tiny text-white/60 uppercase font-bold">
						Wishlist Item
					</p>
					<h4 className="text-white font-medium text-large">
						{currentItem.product}
					</h4>
				</CardHeader>

				<Image
					removeWrapper
					alt={currentItem.product}
					className="z-0 w-full h-full object-cover"
					src={currentItem.image}
				/>

				<CardFooter className="absolute bg-black/40 bottom-0 z-10 border-t-1 border-default-600">
					<div className="flex grow gap-2 items-center">
						<div className="flex flex-col">
							<p className="text-tiny text-white/60">Price Drop Alert</p>
							<div className="flex items-center gap-2">
								<p className="text-white font-bold">{currentItem.price}</p>
								<p className="text-tiny text-white/60 line-through">
									{currentItem.originalPrice}
								</p>
								<p className="text-tiny bg-primary/80 text-white px-2 py-1 rounded-none">
									{currentItem.discount}
								</p>
							</div>
						</div>
					</div>
					<Button
						radius="md"
						size="sm"
						color="primary"
						startContent={<Icon icon="solar:cart-plus-linear" width={16} />}
					>
						Add to Cart
					</Button>
				</CardFooter>
			</Card>

			<div className="flex justify-center gap-1">
				{wishlistItems.map((_, index) => (
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
