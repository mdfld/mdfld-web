"use client";

import "@/styles/globals.css";
import clsx from "clsx";
import { fontSans } from "@/config/fonts";
export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<body
			className={clsx(
				"min-h-screen text-foreground bg-background font-sans antialiased",
				fontSans.variable,
			)}
		>
			<div className="">{children}</div>
		</body>
	);
}
