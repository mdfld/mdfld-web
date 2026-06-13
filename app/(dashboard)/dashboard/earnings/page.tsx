"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@heroui/react";
import { DollarSign, Clock, CheckCircle, Wallet } from "lucide-react";

const ACCENT = "#00d4b6";

export default function EarningsPage() {
	const { data, isLoading } = trpc.organization.getEarnings.useQuery();
	const requestPayout = trpc.organization.requestPayout.useMutation({
		onSuccess: () => { setPayoutAmount(""); setPayoutSent(true); setTimeout(() => setPayoutSent(false), 4000); },
	});

	const [payoutAmount, setPayoutAmount] = useState("");
	const [payoutSent, setPayoutSent] = useState(false);

	if (isLoading) return <div style={{ padding: 40, color: "#64748b" }}>Loading...</div>;

	if (!data) return (
		<div style={{ padding: 40 }}>
			<h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 800 }}>Earnings</h1>
			<p style={{ color: "#64748b", marginTop: 8 }}>You don&apos;t have a seller profile yet. Create a store to start selling.</p>
		</div>
	);

	const pending = data.pendingBalance ?? 0;
	const locked = data.lockedBalance ?? 0;
	const available = data.availableBalance ?? 0;
	const settled = data.settledBalance ?? 0;
	const total = pending + settled;
	const platformCut = Math.round(data.commissionRate * 100);

	return (
		<div style={{ padding: 32, fontFamily: "'Barlow', sans-serif", maxWidth: 900 }}>
			<style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@400;500;600;700&display=swap');`}</style>

			{/* Header */}
			<div style={{ marginBottom: 32 }}>
				<h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: "-0.03em", textTransform: "uppercase", color: "#0f172a" }}>
					Earnings
				</h1>
				<p style={{ color: "#64748b", marginTop: 4, fontSize: 13 }}>
					Platform commission: {platformCut}% &nbsp;·&nbsp; {data.totalSales} total sales
				</p>
			</div>

			{!data.payoutMethod && (
				<div style={{ background: "#fefce8", border: "1px solid #fde047", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, display: "flex", gap: 12, alignItems: "center" }}>
					Set up your payout method to receive earnings.
					<a href="/dashboard/settings/payout" style={{ fontWeight: 700, color: "#854d0e", textDecoration: "underline" }}>Set up now</a>
				</div>
			)}

			{/* Balance cards */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
				<div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
						<div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,212,182,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
							<Wallet size={18} color={ACCENT} />
						</div>
						<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Available</span>
					</div>
					<div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "'Barlow Condensed', sans-serif" }}>
						${available.toFixed(2)}
					</div>
					<p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Available to request</p>
				</div>

				<div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
						<div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
							<Clock size={18} color="#f59e0b" />
						</div>
						<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Locked</span>
					</div>
					<div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "'Barlow Condensed', sans-serif" }}>
						${locked.toFixed(2)}
					</div>
					<p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Awaiting shipment</p>
				</div>

				<div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
						<div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
							<CheckCircle size={18} color="#22c55e" />
						</div>
						<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Paid Out</span>
					</div>
					<div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "'Barlow Condensed', sans-serif" }}>
						${settled.toFixed(2)}
					</div>
					<p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Already settled</p>
				</div>

				<div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
						<div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
							<DollarSign size={18} color="#6366f1" />
						</div>
						<span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Earned</span>
					</div>
					<div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "'Barlow Condensed', sans-serif" }}>
						${total.toFixed(2)}
					</div>
					<p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>All time</p>
				</div>
			</div>

			{/* Payout method + payout request */}
			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
				{/* Payout method */}
				<div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginTop: 8 }}>
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
						<span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Payout Method</span>
					</div>
					{data.payoutMethod ? (
						<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
							<span style={{ fontWeight: 700, fontSize: 16 }}>{data.payoutMethod === "STRIPE_BANK" ? "Bank Account" : "PayPal"}</span>
							<span style={{ color: "#64748b", fontSize: 14 }}>{data.displayDetail}</span>
							<a href="/dashboard/settings/payout" style={{ fontSize: 12, color: ACCENT, textDecoration: "underline" }}>Change</a>
						</div>
					) : (
						<a href="/dashboard/settings/payout" style={{ display: "inline-block", marginTop: 4, padding: "8px 16px", background: "#000", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
							Set Up Payout Method
						</a>
					)}
				</div>

				{/* Request payout */}
				<div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
					<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
						<DollarSign size={18} color="#64748b" />
						<h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#0f172a" }}>Request Payout</h3>
					</div>
					{payoutSent ? (
						<div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(34,197,94,0.08)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.2)" }}>
							<CheckCircle size={16} color="#22c55e" />
							<span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>Payout request sent! We&apos;ll process it within 2–3 business days.</span>
						</div>
					) : (
						<>
							<p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>
								Available: <strong style={{ color: "#0f172a" }}>${available.toFixed(2)}</strong>
							</p>
							<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
								<span style={{ fontSize: 14, color: "#64748b" }}>$</span>
								<input
									type="number" min="1" max={available} step="0.01"
									value={payoutAmount}
									onChange={e => setPayoutAmount(e.target.value)}
									placeholder={available.toFixed(2)}
									style={{ flex: 1, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, fontWeight: 600 }}
								/>
							</div>
							<Button
								color="primary"
								isLoading={requestPayout.isPending}
								isDisabled={!data.payoutMethod || !payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > available}
								onPress={() => requestPayout.mutate({ amount: parseFloat(payoutAmount) })}
								style={{ width: "100%", fontWeight: 700, background: ACCENT, color: "#020a0a", fontSize: 13 }}
							>
								Request Payout
							</Button>
							{!data.payoutMethod && (
								<p style={{ fontSize: 11, color: "#f59e0b", marginTop: 8 }}>Set up a payout method first to request a payout.</p>
							)}
						</>
					)}
				</div>
			</div>

			{/* Transaction history */}
			{data.transactions.length > 0 && (
				<div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
					<h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, fontWeight: 800, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "-0.02em" }}>
						Transaction History
					</h3>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr style={{ borderBottom: "2px solid #f1f5f9" }}>
								{["Date", "Type", "Amount", "Status"].map(h => (
									<th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{(data.transactions as any[]).map(tx => (
								<tr key={tx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
									<td style={{ padding: "12px", fontSize: 13, color: "#64748b" }}>{new Date(tx.createdAt).toLocaleDateString()}</td>
									<td style={{ padding: "12px" }}>
										<span style={{
											padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
											background: tx.type === "PAYOUT" ? "rgba(99,102,241,0.1)" : "rgba(0,212,182,0.1)",
											color: tx.type === "PAYOUT" ? "#6366f1" : ACCENT,
										}}>{tx.type}</span>
									</td>
									<td style={{ padding: "12px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>${Number(tx.amount).toFixed(2)}</td>
									<td style={{ padding: "12px" }}>
										<span style={{
											padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700,
											background: tx.status === "COMPLETED" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
											color: tx.status === "COMPLETED" ? "#22c55e" : "#f59e0b",
										}}>{tx.status}</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
