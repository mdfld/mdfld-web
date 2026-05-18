"use client";
import { trpc } from "@/lib/trpc-client";

export default function AdminPaymentsPage() {
	const { data, isLoading } = trpc.admin.getPaymentsSummary.useQuery();

	if (isLoading) return <div style={{ padding: 32 }}>Loading...</div>;

	const stats = [
		{ label: "Total Collected", value: data?.totalCollected, color: "#00d4b6" },
		{ label: "Platform Commission (10%)", value: data?.totalCommission, color: "#0066ff" },
		{ label: "Owed to Sellers", value: data?.totalOwedToSellers, color: "#f59e0b" },
		{ label: "Already Settled", value: data?.totalSettled, color: "#6b7280" },
	];

	return (
		<div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
			<h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Payments Dashboard</h1>

			<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
				{stats.map((stat) => (
					<div key={stat.label} style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderTop: `4px solid ${stat.color}` }}>
						<div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{stat.label}</div>
						<div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>
							${Number(stat.value ?? 0).toFixed(2)}
						</div>
					</div>
				))}
			</div>

			<a href="/admin/settlements" style={{ display: "inline-block", padding: "10px 24px", background: "#000", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
				Manage Settlements →
			</a>
		</div>
	);
}
