"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";
import { Building2, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";

const ACCENT = "#00d4b6";
const BLUE = "#0066ff";

export default function AdminStoresPage() {
	const [statusFilter, setStatusFilter] = useState<"APPROVED" | "SUSPENDED" | undefined>(undefined);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

	const { data, isLoading, refetch } = trpc.admin.listStores.useQuery({
		status: statusFilter,
		limit: 50,
	});

	const suspendStore = trpc.admin.suspendStore.useMutation({ onSuccess: () => refetch() });
	const deleteStore = trpc.admin.deleteStore.useMutation({ onSuccess: () => { setConfirmDelete(null); refetch(); } });

	const stores = (data?.stores ?? []) as any[];

	return (
		<div style={{ fontFamily: "'Barlow', sans-serif" }}>
			<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

			{/* Header */}
			<div style={{ marginBottom: 28, animation: "fadeIn 0.5s ease" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
					<div style={{ width: 4, height: 32, background: `linear-gradient(180deg, ${ACCENT} 0%, ${BLUE} 100%)`, borderRadius: 2 }} />
					<h1 style={{
						fontFamily: "'Barlow Condensed', sans-serif",
						fontSize: 36, fontWeight: 900, margin: 0,
						letterSpacing: "-0.03em", textTransform: "uppercase",
						background: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
						WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
					}}>
						Stores Management
					</h1>
				</div>
				<p style={{ fontSize: 13, color: "#64748b", marginLeft: 14, fontWeight: 500 }}>
					{stores.length} store{stores.length !== 1 ? "s" : ""}
				</p>
			</div>

			{/* Filters */}
			<div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
				{([
					{ label: "All", value: undefined },
					{ label: "Active", value: "APPROVED" },
					{ label: "Suspended", value: "SUSPENDED" },
				] as const).map(({ label, value }) => (
					<button
						key={label}
						onClick={() => setStatusFilter(value)}
						style={{
							padding: "6px 18px", borderRadius: 20, border: "1px solid",
							borderColor: statusFilter === value ? ACCENT : "#e2e8f0",
							background: statusFilter === value ? ACCENT : "#fff",
							color: statusFilter === value ? "#fff" : "#334155",
							fontWeight: 600, fontSize: 13, cursor: "pointer",
						}}
					>
						{label}
					</button>
				))}
			</div>

			{/* Table */}
			<div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
				{isLoading ? (
					<div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading stores...</div>
				) : !stores.length ? (
					<div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No stores found.</div>
				) : (
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr style={{ borderBottom: "1px solid #f1f5f9" }}>
								{["Store", "Owner", "Products", "Status", "Created", "Actions"].map(h => (
									<th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{stores.map((org) => {
								const owner = org.members?.[0]?.user;
								const isSuspended = org.storeStatus === "SUSPENDED";
								return (
									<tr key={org.id} style={{ borderBottom: "1px solid #f8fafc" }}>
										<td style={{ padding: "14px 16px" }}>
											<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
												<div style={{ width: 36, height: 36, borderRadius: 10, background: ACCENT + "18", border: `1px solid ${ACCENT}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
													<Building2 size={16} color={ACCENT} />
												</div>
												<div>
													<div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{org.sellerProfile?.storeName ?? org.name}</div>
													<div style={{ fontSize: 12, color: "#94a3b8" }}>@{org.slug}</div>
												</div>
											</div>
										</td>
										<td style={{ padding: "14px 16px" }}>
											<div style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>{owner?.name ?? "—"}</div>
											<div style={{ fontSize: 12, color: "#94a3b8" }}>{owner?.email ?? ""}</div>
										</td>
										<td style={{ padding: "14px 16px", fontSize: 14, color: "#334155", fontWeight: 600 }}>
											{org._count?.products ?? 0}
										</td>
										<td style={{ padding: "14px 16px" }}>
											<span style={{
												display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
												background: isSuspended ? "rgba(239,68,68,0.1)" : "rgba(0,212,182,0.1)",
												color: isSuspended ? "#ef4444" : ACCENT,
												border: `1px solid ${isSuspended ? "rgba(239,68,68,0.2)" : ACCENT + "30"}`,
											}}>
												{isSuspended ? "Suspended" : "Active"}
											</span>
										</td>
										<td style={{ padding: "14px 16px", fontSize: 13, color: "#94a3b8" }}>
											{new Date(org.createdAt).toLocaleDateString()}
										</td>
										<td style={{ padding: "14px 16px" }}>
											<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
												<button
													onClick={() => suspendStore.mutate({ organizationId: org.id, suspend: !isSuspended })}
													disabled={suspendStore.isPending}
													style={{
														padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
														background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
														fontSize: 12, fontWeight: 600, color: isSuspended ? ACCENT : "#f59e0b",
													}}
												>
													{isSuspended ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
													{isSuspended ? "Restore" : "Suspend"}
												</button>

												{confirmDelete === org.id ? (
													<>
														<button
															onClick={() => deleteStore.mutate({ organizationId: org.id })}
															disabled={deleteStore.isPending}
															style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #fca5a5", background: "#fef2f2", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#ef4444" }}
														>
															Confirm delete
														</button>
														<button
															onClick={() => setConfirmDelete(null)}
															style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, color: "#94a3b8" }}
														>
															Cancel
														</button>
													</>
												) : (
													<button
														onClick={() => setConfirmDelete(org.id)}
														style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#ef4444" }}
													>
														<Trash2 size={13} />
														Delete
													</button>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
