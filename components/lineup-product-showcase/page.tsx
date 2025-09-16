"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { cn } from "@heroui/react";
import { Input } from "@heroui/react";

interface SlideData {
	id: number;
	title: string;
	description: string;
	image: string;
}

const slides: SlideData[] = [
	{
		id: 1,
		title: "DISCOVER THE FINEST FOOTBALL STUFF.",
		description:
			"Discover a vibrant marketplace where you can explore exclusive kits, premium gear, rare memorabilia, and the latest drops—all curated for true football enthusiasts.",
		image:
			"https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjjzyuhjq9citS3x0WGLsIg7PbChw4oaymOZrH",
	},
	{
		id: 2,
		title: "DISCOVER THE FINEST FOOTBALL STUFF.",
		description:
			"Discover a vibrant marketplace where you can explore exclusive kits, premium gear, rare memorabilia, and the latest drops—all curated for true football enthusiasts.",
		image:
			"https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjjzyuhjq9citS3x0WGLsIg7PbChw4oaymOZrH",
	},
	{
		id: 3,
		title: "DISCOVER THE FINEST FOOTBALL STUFF.",
		description:
			"Discover a vibrant marketplace where you can explore exclusive kits, premium gear, rare memorabilia, and the latest drops—all curated for true football enthusiasts.",
		image:
			"https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjjzyuhjq9citS3x0WGLsIg7PbChw4oaymOZrH",
	},
];

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
	const [currentSlide, setCurrentSlide] = useState(0);
	const [textPosition, setTextPosition] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setTextPosition((prev) => (prev + 2) % 400); // Cycle through positions
		}, 50);
		return () => clearInterval(interval);
	}, []);

	return (
		<>
			<style jsx>{`
        @keyframes breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .breathing-animation {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>
			<div className="relative w-[95vw] min-h-screen bg-background flex overflow-hidden">
				{/* Left Vertical Tabs Section */}
				<div className="flex">
					{/* Vertical Border Line with Active Sections */}
					<div className="relative my-8 ml-4">
						<div className="w-px h-full bg-foreground/20"></div>
						{slides.map((_, index) => {
							const totalHeight = 100; // percent
							const sectionHeight = totalHeight / slides.length;
							const sectionCenter = index * sectionHeight + sectionHeight / 2;
							const highlightHeight = 12; // height of highlight in percent
							const highlightTop = sectionCenter - highlightHeight / 2;

							return (
								<div
									key={index}
									className={cn(
										"absolute w-px transition-colors duration-300",
										currentSlide === index ? "bg-teal-500" : "bg-transparent",
									)}
									style={{
										top: `${highlightTop}%`,
										height: `${highlightHeight}%`,
									}}
								></div>
							);
						})}
					</div>

					{/* Tab Numbers */}
					<div className="flex flex-col justify-center items-center w-32 py-8">
						{slides.map((_, index) => (
							<button
								key={index}
								onClick={() => setCurrentSlide(index)}
								className={cn(
									"text-2xl font-light py-4 transition-colors duration-300",
									currentSlide === index
										? "text-teal-500"
										: "text-foreground/50 hover:text-foreground/80",
								)}
							>
								{String(index + 1).padStart(2, "0")}
							</button>
						))}
					</div>
				</div>

				{/* Main Content Area */}
				<div className="flex-1 flex items-center justify-center p-8 pl-2 overflow-visible">
					<div className="w-full overflow-visible">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center overflow-visible">
							{/* Slide Content */}
							<div className="space-y-6">
								<h2 className="text-5xl font-bold text-foreground">
									{slides[currentSlide].title}
								</h2>
								<p className="text-lg text-foreground/80 leading-relaxed">
									{slides[currentSlide].description}
								</p>
								<div className="flex gap-2">
									<span>
										<Input
											isClearable
											classNames={{
												label: "text-black/50 dark:text-white/90",
												input: [
													"bg-transparent",
													"text-black/90 dark:text-white/90",
													"placeholder:text-default-700/50 dark:placeholder:text-white/60",
												],
												innerWrapper: "bg-transparent",
												inputWrapper: [
													"shadow-sm",
													"bg-default-200/50",
													"dark:bg-default/60",
													"backdrop-blur-xl",
													"backdrop-saturate-200",
													"hover:bg-default-200/70",
													"dark:hover:bg-default/70",
													"group-data-[focus=true]:bg-default-200/50",
													"dark:group-data-[focus=true]:bg-default/60",
													"cursor-text!",
												],
											}}
											placeholder="Search for brand, colors, etc."
											radius="full"
											startContent={
												<>
													<SearchIcon className="mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none shrink-0" />
												</>
											}
										/>
									</span>
									<span>
										<Button
											variant="shadow"
											radius="full"
											className="uppercase bg-teal-400 px-8 border-foreground font-semibold"
										>
											Search
										</Button>
									</span>
								</div>
							</div>

							{/* Slide Image */}
							<div className="relative overflow-visible" style={{ zIndex: 9 }}>
								<div
									className="w-full h-80 p-30 rounded-lg"
									style={{
										zIndex: 9,
										transform: "scaleX(-1) rotate(45deg)",
										filter: "drop-shadow(24px 24px 32px rgba(0, 0, 0, 0.8))",
										overflow: "visible",
									}}
								>
									<img
										src={slides[currentSlide].image}
										alt={slides[currentSlide].title}
										className="w-full h-full object-cover rounded breathing-animation"
										style={{ overflow: "visible" }}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Rotated Rectangle Container */}
				<div
					className="absolute"
					style={{
						left: "70%",
						top: "0%",
						transform: "scaleX(1) scaleY(2) rotate(-20deg)",
						transformOrigin: "center",
						zIndex: 1,
					}}
				>
					{/* Large Vertical Teal Rectangle */}
					<div
						className="bg-teal-600 opacity-80"
						style={{
							width: "180px",
							height: "100vh",
							position: "relative",
						}}
					></div>

					{/* Left White Rectangle */}
					<div
						className="absolute bg-white"
						style={{
							left: "-10px",
							top: "0",
							width: "12px",
							height: "100vh",
							zIndex: 3,
						}}
					></div>

					{/* Thick Soft White Rectangle */}
					<div
						className="absolute bg-gray-100 opacity-90"
						style={{
							left: "185px",
							top: "0",
							width: "28px",
							height: "100vh",
						}}
					></div>

					{/* Sideways Text Overlay on Soft White Rectangle */}
					<div
						className="absolute overflow-hidden"
						style={{
							left: "185px",
							top: "0",
							width: "28px",
							height: "100vh",
							zIndex: 4,
						}}
					>
						<div
							className="flex flex-col text-xs font-bold text-black uppercase tracking-wider"
							style={{
								transform: `translateY(${textPosition - 100}px) rotate(-90deg)`,
								transformOrigin: "center",
								whiteSpace: "nowrap",
								transition: "transform 0.05s linear",
								position: "absolute",
								left: "50%",
								top: "50%",
							}}
						>
							<div className="py-4">PERFORMANCE</div>
							<div className="py-4">INNOVATION</div>
							<div className="py-4">EXCELLENCE</div>
							<div className="py-4">PRECISION</div>
							<div className="py-4">QUALITY</div>
							<div className="py-4">DESIGN</div>
						</div>
					</div>
				</div>

				{/* Right Border */}
				<div className="absolute right-0 top-0 bottom-0 w-px bg-foreground/20"></div>

				{/* FOOTBALL Stroke Text Overlay */}
				<div
					className="absolute bottom-48 left-8 text-8xl font-thin uppercase select-none pointer-events-none opacity-15"
					style={{
						fontFamily: "Gordita, sans-serif",
						WebkitTextStroke: "1px white",
						WebkitTextFillColor: "transparent",
						letterSpacing: "0.3em",
						zIndex: 10,
					}}
				>
					FOOTBALL
				</div>
			</div>
		</>
	);
};
