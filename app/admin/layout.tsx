import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
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

	// Fetch role directly from DB — don't rely on session cache
	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { role: true },
	});

	const role = dbUser?.role;
	if (!role || (role !== "SUPER_ADMIN" && role !== "ADMIN")) {
		return (
			<div style={{ padding: 40, fontFamily: "monospace" }}>
				<h1>403 — Access Denied</h1>
				<p>role: {String(role)}</p>
				<p>userId: {session!.user.id}</p>
			</div>
		);
	}

	return (
		<div className="h-screen overflow-hidden">
			<AdminSidebarWrapper>{children}</AdminSidebarWrapper>
		</div>
	);
}
