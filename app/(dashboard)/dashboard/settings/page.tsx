"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import SettingsLayout from "@/components/dashboard/settings/app";

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
				<div className="flex-1 p-4 overflow-y-auto">
					<Suspense fallback={<Spinner size="lg" />}>
						<SettingsLayout />
					</Suspense>
				</div>
			</SidebarWrapper>
		</div>
	);
}
