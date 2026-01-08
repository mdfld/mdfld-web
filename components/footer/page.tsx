"use client";

import type { IconProps } from "@iconify/react";

import React from "react";
import { Link, Spacer } from "@heroui/react";
import { Icon } from "@iconify/react";

type SocialIconProps = Omit<IconProps, "icon">;

const navLinks = [
	{
		name: "Home",
		href: "/",
	},
	{
		name: "About",
		href: "/about",
	},
	{
		name: "Shop",
		href: "/shop",
	},
	{
		name: "Sales",
		href: "/sales",
	},
	{
		name: "Contact",
		href: "/contact",
	},
	{
		name: "Terms",
		href: "/terms",
	},
	{
		name: "Privacy",
		href: "/privacy",
	},
];

const socialItems = [
	{
		name: "Instagram",
		href: "https://www.instagram.com/mdfldmarketplace/",
		icon: (props: SocialIconProps) => (
			<Icon {...props} color="teal" icon="fontisto:instagram" />
		),
	},
	{
		name: "LinkedIn",
		href: "https://www.linkedin.com/company/mdfld/",
		icon: (props: SocialIconProps) => (
			<Icon {...props} color="teal" icon="fontisto:linkedin" />
		),
	},
	{
		name: "YouTube",
		href: "https://www.youtube.com/@mdfld",
		icon: (props: SocialIconProps) => (
			<Icon {...props} color="teal" icon="fontisto:youtube-play" />
		),
	},
];

export default function MainFooter() {
	return (
		<footer className="flex w-full flex-col">
			<div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 py-12 lg:px-8">
				<div className="flex items-center justify-center">
					<span className="text-medium border-l-2 pl-5 tracking-widest font-bold">
						CONTACT
					</span>
					<Icon
						color="teal"
						width={25}
						className="-mt-8"
						icon="heroicons:arrow-up-right-16-solid"
					></Icon>
				</div>
				<Spacer y={4} />
				<div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
					{navLinks.map((item) => (
						<Link
							key={item.name}
							isExternal
							className="text-default-500"
							href={item.href}
							size="sm"
						>
							{item.name}
						</Link>
					))}
				</div>
				<Spacer y={6} />
				<div className="flex justify-center gap-x-4">
					{socialItems.map((item) => (
						<Link
							key={item.name}
							isExternal
							className="text-default-400"
							href={item.href}
						>
							<span className="sr-only">{item.name}</span>
							<item.icon aria-hidden="true" className="w-5" />
						</Link>
					))}
				</div>
				<Spacer y={4} />
				<p className="text-small text-default-400 mt-1 text-center">
					&copy; 2025 MDFLD, Inc. All rights reserved.
				</p>
			</div>
		</footer>
	);
}
