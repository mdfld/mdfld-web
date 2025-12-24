"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const heroData = {
	title: "DISCOVER THE FINEST FOOTBALL STUFF.",
	description:
		"Discover a vibrant marketplace where you can explore exclusive kits, premium gear, rare memorabilia, and the latest drops—all curated for true football enthusiasts.",
	image:
		"https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjjzyuhjq9citS3x0WGLsIg7PbChw4oaymOZrH",
	eyebrow: "Featured Collection",
};

export const SearchIcon = (props: any) => {
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
			<path
				d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
			<path
				d="M22 22L20 20"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
};

export const LineupProductShowcase = () => {
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = () => {
		if (searchQuery.trim()) {
			router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
		} else {
			router.push("/shop");
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch();
		}
	};

	return (
		<section
			aria-label="Hero section - Featured products"
			className="w-full flex items-center justify-center py-4 md:py-6"
		>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				className="relative w-[95vw] md:w-[90vw] lg:w-[85vw] max-w-7xl min-h-[70vh] md:min-h-[75vh] lg:min-h-[80vh] bg-cover bg-center bg-no-repeat rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden"
				style={{
					backgroundImage: `url('${heroData.image}')`,
				}}
			>
				{/* Overlay Layer 1: Darken image */}
				<div className="absolute inset-0 backdrop-brightness-50 backdrop-saturate-110" />

				{/* Overlay Layer 2: Teal brand wash */}
				<div className="absolute inset-0 bg-teal-500/20 mix-blend-overlay" />

				{/* Overlay Layer 3: Gradient for text readability */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

				{/* Content Container */}
				<div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-12 md:px-12 md:py-16 lg:px-16 lg:py-20 min-h-[70vh] md:min-h-[75vh] lg:min-h-[80vh]">
					{/* Eyebrow Label */}
					<span className="text-teal-400 uppercase text-xs md:text-sm tracking-wider font-semibold mb-4">
						{heroData.eyebrow}
					</span>

					{/* Main Heading */}
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white uppercase tracking-wide mb-6 max-w-4xl">
						{heroData.title}
					</h1>

					{/* Description */}
					<p className="text-base md:text-lg text-white/90 leading-relaxed mb-8 md:mb-12 max-w-2xl">
						{heroData.description}
					</p>

					{/* Search Section */}
					<div className="w-full max-w-2xl flex flex-col md:flex-row gap-3">
						<Input
							isClearable
							aria-label="Search products"
							value={searchQuery}
							onValueChange={setSearchQuery}
							onKeyPress={handleKeyPress}
							classNames={{
								label: "text-white/90",
								input: [
									"bg-transparent",
									"text-white/90",
									"placeholder:text-white/60",
								],
								innerWrapper: "bg-transparent",
								inputWrapper: [
									"shadow-lg",
									"bg-white/10",
									"backdrop-blur-xl",
									"backdrop-saturate-200",
									"hover:bg-white/20",
									"group-data-[focus=true]:bg-white/15",
									"border",
									"border-white/20",
								],
							}}
							placeholder="Search for brand, colors, kits..."
							radius="full"
							size="lg"
							startContent={<SearchIcon className="text-white/90" />}
						/>
						<Button
							variant="shadow"
							radius="full"
							size="lg"
							className="uppercase bg-teal-400 hover:bg-teal-500 px-8 md:px-12 font-semibold transition-all hover:scale-105 active:scale-95"
							onPress={handleSearch}
						>
							Search
						</Button>
					</div>
				</div>
			</motion.div>
		</section>
	);
};
