import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import AdminSidebarWrapper from "@/components/sidebar/admin/app";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const headersList = await headers();

	const session = await auth.api.getSession({
		headers: headersList,
	});

	if (!session?.user) {
		redirect("/auth/login");
	}

	return (
		<div className="h-screen overflow-hidden">
			<AdminSidebarWrapper>{children}</AdminSidebarWrapper>
		</div>
	);
}
