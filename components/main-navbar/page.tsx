"use client";

import type { NavbarProps } from "@heroui/react";
import { SignedIn, SignedOut } from "@daveyplate/better-auth-ui";

import React from "react";
import {
	Navbar,
	NavbarBrand,
	NavbarContent,
	NavbarItem,
	NavbarMenu,
	NavbarMenuItem,
	NavbarMenuToggle,
	Button,
	Divider,
	Image as HeroImage,
} from "@heroui/react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";

import { siteConfig } from "@/config/site";
import Link from "next/link";
import NextLink from "next/link";
import { link as linkStyles } from "@heroui/theme";
import clsx from "clsx";

const menuItems = [
	"About",
	"Blog",
	"Customers",
	"Pricing",
	"Enterprise",
	"Changelog",
	"Documentation",
	"Contact Us",
];

export default function MainNavbar(props: NavbarProps) {
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);

	return (
		<Navbar
			{...props}
			classNames={{
				base: cn("border-default-100", {
					"bg-default dark:bg-default-100": isMenuOpen,
				}),
				wrapper: "w-full justify-center",
				item: "hidden md:flex",
			}}
			height="60px"
			isMenuOpen={isMenuOpen}
			onMenuOpenChange={setIsMenuOpen}
		>
			{/* Left Content */}
			<NavbarBrand className="bg-transparent">
				<div className="text-background rounded-full">
					<Image
						src="https://n4ctyckve4.ufs.sh/f/oNMWZPwVRgqjlsYla8wKE2TjwSU8x3apY10zR5NV9ighPDtr"
						alt="mdfld logo"
						width={100}
						height={10}
						className="bg-transparent"
					></Image>
				</div>
			</NavbarBrand>

			{/* Center Content */}
			<NavbarContent justify="center" className="align-middle">
				<ul className="hidden align-middle lg:flex gap-4 justify-start ml-2">
					{siteConfig.navItems.map((item) => (
						<NavbarItem
							className="uppercase font-normal text-sm tracking-wide"
							key={item.href}
						>
							<NextLink
								className={clsx(
									linkStyles({ color: "foreground", size: "sm" }),
									"data-[active=true]:text-primary data-[active=true]:font-medium",
								)}
								color="foreground"
								href={item.href}
							>
								{item.label}
							</NextLink>
						</NavbarItem>
					))}
				</ul>
			</NavbarContent>

			{/* Right Content */}
			<NavbarContent className="hidden md:flex" justify="end">
				<NavbarItem className="ml-2 flex! gap-4">
					<Icon icon="octicon:person-24"></Icon>
					<Icon icon="octicon:heart-24"></Icon>
					<Icon icon="ion:bag-outline"></Icon>
				</NavbarItem>
			</NavbarContent>

			<NavbarMenuToggle className="text-default-400 md:hidden" />

			<NavbarMenu className="bg-default-200/50 shadow-medium dark:bg-default-100/50 top-[calc(var(--navbar-height)-1px)] max-h-fit pt-6 pb-6 backdrop-blur-lg backdrop-saturate-150">
				<NavbarMenuItem>
					<Button fullWidth as={Link} href="/#" variant="faded">
						Sign In
					</Button>
				</NavbarMenuItem>
				<NavbarMenuItem className="mb-4">
					<Button
						fullWidth
						as={Link}
						className="bg-foreground text-background"
						href="/#"
					>
						Get Started
					</Button>
				</NavbarMenuItem>
				{menuItems.map((item, index) => (
					<NavbarMenuItem key={`${item}-${index}`}>
						<Link className="text-default-500 mb-2 w-full" href="#">
							{item}
						</Link>
						{index < menuItems.length - 1 && <Divider className="opacity-50" />}
					</NavbarMenuItem>
				))}
			</NavbarMenu>
		</Navbar>
	);
}
