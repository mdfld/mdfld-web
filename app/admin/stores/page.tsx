"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";

export default function AdminStoresPage() {
	const [statusFilter, setStatusFilter] = useState<
		"PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | undefined
	>("PENDING");

	const { data, isLoading, refetch } = trpc.admin.listStores.useQuery({
		status: statusFilter,
		limit: 20,
	});

	const approveStore = trpc.admin.approveStore.useMutation({
		onSuccess: () => refetch(),
	});
	const rejectStore = trpc.admin.rejectStore.useMutation({
		onSuccess: () => refetch(),
	});

	return (
		<div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
			<h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>
				Stores Management
			</h1>

			<div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
				{(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const).map((s) => (
					<button
						key={s}
						onClick={() => setStatusFilter(s)}
						style={{
							padding: "6px 16px",
							borderRadius: 6,
							border: "1px solid",
							borderColor: statusFilter === s ? "#00d4b6" : "#ccc",
							background: statusFilter === s ? "#00d4b6" : "white",
							color: statusFilter === s ? "white" : "#333",
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						{s}
					</button>
				))}
			</div>

			{isLoading ? (
				<p>Loading...</p>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ borderBottom: "2px solid #eee" }}>
							{["Store", "Owner", "Status", "Sales", "Actions"].map((h) => (
								<th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data?.stores.map((org) => (
							<tr key={org.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
								<td style={{ padding: "12px" }}>
									<strong>{org.name}</strong>
									<div style={{ fontSize: 12, color: "#999" }}>{org.slug}</div>
								</td>
								<td style={{ padding: "12px", fontSize: 14 }}>
									{org.members[0]?.userId ?? "—"}
								</td>
								<td style={{ padding: "12px" }}>
									<span style={{
										padding: "2px 8px",
										borderRadius: 12,
										fontSize: 12,
										fontWeight: 600,
										background: org.storeStatus === "APPROVED" ? "#d1fae5" : org.storeStatus === "PENDING" ? "#fef3c7" : "#fee2e2",
										color: org.storeStatus === "APPROVED" ? "#065f46" : org.storeStatus === "PENDING" ? "#92400e" : "#991b1b",
									}}>
										{org.storeStatus}
									</span>
								</td>
								<td style={{ padding: "12px", fontSize: 14 }}>
									{org.sellerProfile?.totalSales ?? 0}
								</td>
								<td style={{ padding: "12px", display: "flex", gap: 8 }}>
									{org.storeStatus === "PENDING" && (
										<>
											<button
												onClick={() => approveStore.mutate({ organizationId: org.id })}
												style={{ padding: "4px 12px", background: "#00d4b6", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
											>
												Approve
											</button>
											<button
												onClick={() => rejectStore.mutate({ organizationId: org.id })}
												style={{ padding: "4px 12px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
											>
												Reject
											</button>
										</>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
