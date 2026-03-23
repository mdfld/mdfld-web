import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminSidebarWrapper from "@/components/sidebar/admin/app";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	let session;
	try {
		session = await auth.api.getSession({ headers: await headers() });
	} catch {
		redirect("/auth/login?from=/admin");
	}

	if (!session?.user) {
		redirect("/auth/login?from=/admin");
	}

	const role = (session.user as { role?: string }).role;
	if (!role || (role !== "SUPER_ADMIN" && role !== "ADMIN")) {
		redirect("/");
	}

	return (
		<div className="h-screen overflow-hidden">
			<AdminSidebarWrapper>{children}</AdminSidebarWrapper>
		</div>
	);
}
