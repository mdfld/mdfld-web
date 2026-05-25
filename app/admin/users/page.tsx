"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";

const ROLES = ["SUPER_ADMIN", "ADMIN", "SELLER", "BUYER"] as const;

const roleStyle = (role: string) => ({
	SUPER_ADMIN: { background: "#ede9fe", color: "#5b21b6" },
	ADMIN: { background: "#fef3c7", color: "#92400e" },
	SELLER: { background: "#dbeafe", color: "#1e40af" },
	BUYER: { background: "#f3f4f6", color: "#374151" },
}[role] ?? { background: "#f3f4f6", color: "#374151" });

export default function AdminUsersPage() {
	const [search, setSearch] = useState("");
	const [updatingId, setUpdatingId] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
	const utils = trpc.useUtils();

	const { data, isLoading } = trpc.admin.listUsers.useQuery({
		search: search || undefined,
		limit: 50,
	});

	const updateRole = trpc.admin.updateUserRole.useMutation({
		onSuccess: () => utils.admin.listUsers.invalidate(),
	});

	const adminDeleteAccount = trpc.user.adminDeleteAccount.useMutation({
		onSuccess: () => {
			utils.admin.listUsers.invalidate();
			setConfirmDelete(null);
		},
	});

	async function handleRoleChange(userId: string, role: typeof ROLES[number]) {
		setUpdatingId(userId);
		try {
			await updateRole.mutateAsync({ userId, role });
		} finally {
			setUpdatingId(null);
		}
	}

	async function handleDeleteConfirm() {
		if (!confirmDelete) return;
		setDeletingId(confirmDelete.id);
		try {
			await adminDeleteAccount.mutateAsync({ userId: confirmDelete.id });
		} finally {
			setDeletingId(null);
		}
	}

	return (
		<div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
			<h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Users</h1>

			<input
				type="text"
				placeholder="Search by name, email, or username..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				style={{ width: "100%", maxWidth: 400, padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, marginBottom: 20 }}
			/>

			{isLoading ? (
				<p>Loading...</p>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ borderBottom: "2px solid #eee" }}>
							{["Name", "Email", "Role", "KYC", "Seller", "Joined", ""].map((h) => (
								<th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data?.users.map((user) => (
							<tr key={user.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
								<td style={{ padding: "12px" }}>
									<strong>{user.name}</strong>
									<div style={{ fontSize: 12, color: "#999" }}>@{user.username}</div>
								</td>
								<td style={{ padding: "12px", fontSize: 14 }}>{user.email}</td>
								<td style={{ padding: "12px" }}>
									<select
										disabled={updatingId === user.id}
										value={user.role}
										onChange={(e) => handleRoleChange(user.id, e.target.value as typeof ROLES[number])}
										style={{
											padding: "2px 6px", borderRadius: 12, fontSize: 12, fontWeight: 600,
											border: "1px solid #ddd", cursor: "pointer", outline: "none",
											...roleStyle(user.role),
											opacity: updatingId === user.id ? 0.5 : 1,
										}}
									>
										{ROLES.map((r) => (
											<option key={r} value={r}>{r}</option>
										))}
									</select>
								</td>
								<td style={{ padding: "12px", fontSize: 13 }}>{user.kycStatus}</td>
								<td style={{ padding: "12px", fontSize: 13 }}>{user.isVerifiedSeller ? "✓" : "—"}</td>
								<td style={{ padding: "12px", fontSize: 13, color: "#666" }}>
									{new Date(user.createdAt).toLocaleDateString()}
								</td>
								<td style={{ padding: "12px" }}>
									<button
										onClick={() => setConfirmDelete({ id: user.id, name: user.name })}
										style={{
											padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
											border: "1px solid #fca5a5", background: "#fff1f2", color: "#b91c1c",
											cursor: "pointer",
										}}
									>
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{/* Confirm delete dialog */}
			{confirmDelete && (
				<div style={{
					position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
					alignItems: "center", justifyContent: "center", zIndex: 1000,
				}}>
					<div style={{
						background: "#fff", borderRadius: 12, padding: 28, maxWidth: 400, width: "90%",
						boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
					}}>
						<h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: "#b91c1c" }}>Delete Account</h2>
						<p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
							Permanently delete <strong>{confirmDelete.name}</strong>? This removes all their data, listings, and order history and cannot be undone.
						</p>
						<div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
							<button
								onClick={() => setConfirmDelete(null)}
								style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ddd", background: "#f9f9f9", fontSize: 13, cursor: "pointer" }}
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteConfirm}
								disabled={deletingId === confirmDelete.id}
								style={{
									padding: "8px 16px", borderRadius: 8, border: "none",
									background: "#b91c1c", color: "#fff", fontSize: 13, fontWeight: 600,
									cursor: "pointer", opacity: deletingId === confirmDelete.id ? 0.6 : 1,
								}}
							>
								{deletingId === confirmDelete.id ? "Deleting..." : "Delete Account"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
