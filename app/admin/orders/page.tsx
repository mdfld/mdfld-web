"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
	PENDING: { bg: "#fef3c7", text: "#92400e" },
	CONFIRMED: { bg: "#d1fae5", text: "#065f46" },
	PROCESSING: { bg: "#dbeafe", text: "#1e40af" },
	SHIPPED: { bg: "#ede9fe", text: "#5b21b6" },
	DELIVERED: { bg: "#d1fae5", text: "#065f46" },
	CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
	REFUNDED: { bg: "#f3f4f6", text: "#374151" },
};

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export default function AdminOrdersPage() {
	const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);

	const { data, isLoading } = trpc.admin.listOrders.useQuery({
		status: statusFilter,
		limit: 30,
	});

	return (
		<div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
			<h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Orders</h1>

			<select
				value={statusFilter ?? ""}
				onChange={(e) => setStatusFilter((e.target.value as OrderStatus) || undefined)}
				style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", marginBottom: 20, fontSize: 14 }}
			>
				<option value="">All Statuses</option>
				{(Object.keys(STATUS_COLORS) as OrderStatus[]).map((s) => (
					<option key={s} value={s}>{s}</option>
				))}
			</select>

			{isLoading ? (
				<p>Loading...</p>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ borderBottom: "2px solid #eee" }}>
							{["Order #", "Buyer", "Store", "Items", "Total", "Status", "Date"].map((h) => (
								<th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{(data?.orders as any[] | undefined)?.map((order) => {
							const colors = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
							return (
								<tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
									<td style={{ padding: "12px", fontSize: 13, fontFamily: "monospace" }}>{order.orderNumber}</td>
									<td style={{ padding: "12px", fontSize: 14 }}>
										{order.buyer.user.name}
										<div style={{ fontSize: 12, color: "#999" }}>{order.buyer.user.email}</div>
									</td>
									<td style={{ padding: "12px", fontSize: 14 }}>{order.seller.storeName}</td>
									<td style={{ padding: "12px", fontSize: 14 }}>{order.items.length}</td>
									<td style={{ padding: "12px", fontSize: 14, fontWeight: 600 }}>${Number(order.total).toFixed(2)}</td>
									<td style={{ padding: "12px" }}>
										<span style={{ padding: "2px 8px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: colors.bg, color: colors.text }}>
											{order.status}
										</span>
									</td>
									<td style={{ padding: "12px", fontSize: 13, color: "#666" }}>
										{new Date(order.createdAt).toLocaleDateString()}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}
		</div>
	);
}
