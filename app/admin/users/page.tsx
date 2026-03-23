"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";

export default function AdminUsersPage() {
	const [search, setSearch] = useState("");

	const { data, isLoading } = trpc.admin.listUsers.useQuery({
		search: search || undefined,
		limit: 50,
	});

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
							{["Name", "Email", "Role", "KYC", "Seller", "Joined"].map((h) => (
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
									<span style={{
										padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600,
										background: user.role === "SUPER_ADMIN" ? "#ede9fe" : user.role === "SELLER" ? "#dbeafe" : "#f3f4f6",
										color: user.role === "SUPER_ADMIN" ? "#5b21b6" : user.role === "SELLER" ? "#1e40af" : "#374151",
									}}>
										{user.role}
									</span>
								</td>
								<td style={{ padding: "12px", fontSize: 13 }}>{user.kycStatus}</td>
								<td style={{ padding: "12px", fontSize: 13 }}>{user.isVerifiedSeller ? "✓" : "—"}</td>
								<td style={{ padding: "12px", fontSize: 13, color: "#666" }}>
									{new Date(user.createdAt).toLocaleDateString()}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
