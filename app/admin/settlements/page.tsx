"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";

type PayoutSummary = {
  sellerName:  string;
  amount:      number;
  method:      string;
  destination: string;
  transferId:  string;
  timestamp:   Date | string;
};

export default function AdminSettlementsPage() {
  const { data, isLoading, refetch } = trpc.admin.listSellerBalances.useQuery({ limit: 100 });
  const triggerPayout = trpc.admin.triggerPayout.useMutation({
    onSuccess: () => { setLastPayout(triggerPayout.data!); refetch(); setConfirm(null); },
  });

  const [tab, setTab]                   = useState<"pending" | "all">("pending");
  const [payoutAmounts, setPayoutAmounts] = useState<Record<string, string>>({});
  const [confirm, setConfirm]           = useState<{ sellerId: string; sellerName: string; amount: number; method: string; destination: string } | null>(null);
  const [lastPayout, setLastPayout]     = useState<PayoutSummary | null>(null);

  const sellers    = data?.sellers ?? [];
  const pendingSellers = sellers.filter((s: any) => s.payoutRequestedAt);
  const displayed  = tab === "pending" ? pendingSellers : sellers;

  const payoutMethodLabel = (s: any) => {
    if (!s.payoutMethod) return { label: "Not set up", detail: "" };
    if (s.payoutMethod === "STRIPE_BANK") return { label: "Bank", detail: `••••${s.stripeBankLast4}` };
    return { label: "PayPal", detail: s.paypalEmail ?? "" };
  };

  const handlePayClick = (seller: any) => {
    const amount = parseFloat(payoutAmounts[seller.id] ?? "0");
    if (!amount || amount <= 0) return;
    const pm = payoutMethodLabel(seller);
    setConfirm({ sellerId: seller.id, sellerName: seller.storeName, amount, method: pm.label, destination: pm.detail });
  };

  return (
    <div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Settlements</h1>
      <p style={{ color: "#666", marginBottom: 20, fontSize: 14 }}>Manage seller payouts.</p>

      {/* Success banner */}
      {lastPayout && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 14 }}>
          Paid <strong>${lastPayout.amount.toFixed(2)}</strong> to <strong>{lastPayout.sellerName}</strong> via {lastPayout.method} ({lastPayout.destination}). Transfer ID: <code style={{ background: "#dcfce7", padding: "2px 6px", borderRadius: 4 }}>{lastPayout.transferId}</code>
          <button onClick={() => setLastPayout(null)} style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#666" }}>Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #eee" }}>
        {(["pending", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", background: "none", border: "none", borderBottom: tab === t ? "2px solid #000" : "none", marginBottom: -2, fontWeight: tab === t ? 700 : 400, cursor: "pointer", fontSize: 14, textTransform: "capitalize" }}>
            {t === "pending" ? `Pending Requests (${pendingSellers.length})` : "All Sellers"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : displayed.length === 0 ? (
        <p style={{ color: "#999" }}>{tab === "pending" ? "No pending payout requests." : "No sellers with balances."}</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["Store", "Email", "Payout Method", "Pending", "Locked", "Available", "Settled", "Amount", "Action"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((seller: any) => {
              const pm = payoutMethodLabel(seller);
              const hasMethod = !!seller.payoutMethod;
              return (
                <tr key={seller.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: 12 }}>
                    <strong>{seller.storeName}</strong>
                    <div style={{ fontSize: 12, color: "#999" }}>{seller.user?.name}</div>
                  </td>
                  <td style={{ padding: 12, fontSize: 13 }}>{seller.businessEmail}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>
                    {hasMethod ? (
                      <span>
                        <span style={{ fontWeight: 700 }}>{pm.label}</span>
                        {pm.detail && <span style={{ color: "#666", marginLeft: 6 }}>{pm.detail}</span>}
                      </span>
                    ) : (
                      <span style={{ color: "#dc2626", fontSize: 12 }}>Not set up</span>
                    )}
                  </td>
                  <td style={{ padding: 12, fontWeight: 700, color: "#f59e0b" }}>
                    ${Number(seller.pendingBalance).toFixed(2)}
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: "#999" }}>
                    ${Number(seller.lockedBalance).toFixed(2)}
                  </td>
                  <td style={{ padding: 12, fontWeight: 700, color: "#16a34a" }}>
                    ${Number(seller.availableBalance).toFixed(2)}
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: "#666" }}>
                    ${Number(seller.settledBalance).toFixed(2)}
                  </td>
                  <td style={{ padding: 12 }}>
                    <input
                      type="number"
                      placeholder={Number(seller.availableBalance).toFixed(2)}
                      value={payoutAmounts[seller.id] ?? ""}
                      onChange={(e) => setPayoutAmounts((prev) => ({ ...prev, [seller.id]: e.target.value }))}
                      style={{ width: 90, padding: "4px 8px", borderRadius: 4, border: "1px solid #ddd", fontSize: 13 }}
                    />
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      disabled={!payoutAmounts[seller.id] || !hasMethod || triggerPayout.isPending}
                      onClick={() => handlePayClick(seller)}
                      style={{ padding: "6px 14px", background: hasMethod ? "#000" : "#ccc", color: "#fff", border: "none", borderRadius: 6, cursor: hasMethod ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 12 }}
                    >
                      Pay Out
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Confirmation modal */}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 420, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Confirm Payout</h2>
            <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.6 }}>
              Pay <strong>${confirm.amount.toFixed(2)}</strong> to <strong>{confirm.sellerName}</strong> via <strong>{confirm.method}</strong> ({confirm.destination})?
            </p>
            {triggerPayout.error && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{triggerPayout.error.message}</p>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => triggerPayout.mutate({ sellerProfileId: confirm.sellerId, amount: confirm.amount })}
                disabled={triggerPayout.isPending}
                style={{ flex: 1, padding: "10px 0", background: "#000", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                {triggerPayout.isPending ? "Sending..." : "Confirm"}
              </button>
              <button
                onClick={() => setConfirm(null)}
                style={{ flex: 1, padding: "10px 0", background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
