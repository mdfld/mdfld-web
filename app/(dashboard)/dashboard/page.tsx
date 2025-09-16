"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import { EmailCheckBanner } from "@/components/dashboard/email-banner";
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { ActiveOrders } from "@/components/dashboard/active-orders";
import { WishlistSpotlight } from "@/components/dashboard/wishlist-spotlight";
import { ReturnsSection } from "@/components/dashboard/returns-section";

export const dynamic = "force-dynamic";

export default function Dashboard() {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/auth/login");
		}
	}, [session, isPending, router]);

	if (typeof window === "undefined" || isPending) {
		return (
			<div className="flex items-center justify-center h-full">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<p className="text-gray-600">Redirecting to login...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen">
			<SidebarWrapper>
				<div className="flex-1 overflow-y-auto">
					<EmailCheckBanner />
					<WelcomeHero />
					<div className="p-4 pb-8 space-y-6">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<ActiveOrders />
							<WishlistSpotlight />
						</div>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							<RecentOrders />
							<ReturnsSection />
						</div>
					</div>
				</div>
			</SidebarWrapper>
		</div>
	);
}
