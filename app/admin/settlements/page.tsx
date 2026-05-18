"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";

export default function AdminSettlementsPage() {
	const { data, isLoading, refetch } = trpc.admin.listSellerBalances.useQuery({ limit: 50 });
	const triggerPayout = trpc.admin.triggerPayout.useMutation({ onSuccess: () => refetch() });
	const [payoutAmounts, setPayoutAmounts] = useState<Record<string, string>>({});

	return (
		<div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
			<h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Settlements</h1>
			<p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
				Sellers with pending balances. Enter amount and trigger manual payout.
			</p>

			{isLoading ? (
				<p>Loading...</p>
			) : data?.sellers.length === 0 ? (
				<p style={{ color: "#999" }}>No sellers with pending balances.</p>
			) : (
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ borderBottom: "2px solid #eee" }}>
							{["Store", "Email", "Bank Account", "Pending", "Settled", "Payout Amount", "Action"].map((h) => (
								<th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data?.sellers.map((seller) => (
							<tr key={seller.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
								<td style={{ padding: "12px" }}>
									<strong>{seller.storeName}</strong>
									<div style={{ fontSize: 12, color: "#999" }}>{seller.user?.name}</div>
								</td>
								<td style={{ padding: "12px", fontSize: 14 }}>{seller.businessEmail}</td>
								<td style={{ padding: "12px", fontSize: 13, color: seller.bankAccount ? "#065f46" : "#991b1b" }}>
									{seller.bankAccount ?? "⚠ Not provided"}
								</td>
								<td style={{ padding: "12px", fontWeight: 700, color: "#f59e0b" }}>
									${Number(seller.pendingBalance).toFixed(2)}
								</td>
								<td style={{ padding: "12px", fontSize: 14, color: "#666" }}>
									${Number(seller.settledBalance).toFixed(2)}
								</td>
								<td style={{ padding: "12px" }}>
									<input
										type="number"
										placeholder="0.00"
										value={payoutAmounts[seller.id] ?? ""}
										onChange={(e) => setPayoutAmounts((prev) => ({ ...prev, [seller.id]: e.target.value }))}
										style={{ width: 90, padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", fontSize: 14 }}
									/>
								</td>
								<td style={{ padding: "12px" }}>
									<button
										disabled={!payoutAmounts[seller.id] || !seller.bankAccount || triggerPayout.isPending}
										onClick={() => triggerPayout.mutate({ sellerProfileId: seller.id, amount: parseFloat(payoutAmounts[seller.id] ?? "0") })}
										style={{ padding: "6px 16px", background: seller.bankAccount ? "#000" : "#ccc", color: "white", border: "none", borderRadius: 6, cursor: seller.bankAccount ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13 }}
									>
										Pay Out
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
