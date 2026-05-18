"use client";

import { useSession } from "@/lib/auth-client";
import DashBanner from "./banner-general";

export const EmailCheckBanner = () => {
	const { data: session, isPending } = useSession();

	if (isPending) return null;

	if (session?.user?.emailVerified) return null;

	return (
		<div className="m-4">
			<DashBanner
				text="Please verify your email!"
				button="Verify Email"
				href="/auth/verify-email"
			/>
		</div>
	);
};
