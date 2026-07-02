"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Button, Input } from "@heroui/react";

const ACCENT = "#00d4b6";

export default function PayoutSetupPage() {
  const utils = trpc.useUtils();
  const { data: setup, isLoading } = trpc.organization.getPayoutSetup.useQuery();

  const setupStripe = trpc.organization.setupStripePayout.useMutation({
    onSuccess: () => utils.organization.getPayoutSetup.invalidate(),
  });
  const setupPaypal = trpc.organization.setupPaypalPayout.useMutation({
    onSuccess: () => utils.organization.getPayoutSetup.invalidate(),
  });

  const [method, setMethod]               = useState<"bank" | "paypal" | null>(null);
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [holderName, setHolderName]       = useState("");
  const [paypalEmail, setPaypalEmail]     = useState("");

  if (isLoading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ padding: 32, fontFamily: "'Barlow', sans-serif", maxWidth: 600 }}>
      <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, margin: 0, textTransform: "uppercase" }}>
        Payout Setup
      </h1>
      <p style={{ color: "#64748b", marginTop: 4, marginBottom: 28, fontSize: 13 }}>
        Choose how you want to receive your earnings.
      </p>

      {setup && (
        <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: 16, marginBottom: 24, fontSize: 14 }}>
          Current method: <strong>{setup.payoutMethod === "STRIPE_BANK" ? "Bank Account" : "PayPal"}</strong> — {setup.displayDetail}
        </div>
      )}

      {/* Method selector */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => setMethod("bank")}
          style={{ flex: 1, padding: "14px 0", border: `2px solid ${method === "bank" ? ACCENT : "#e2e8f0"}`, borderRadius: 10, background: method === "bank" ? "rgba(0,212,182,0.06)" : "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          Bank Account
        </button>
        <button
          onClick={() => setMethod("paypal")}
          style={{ flex: 1, padding: "14px 0", border: `2px solid ${method === "paypal" ? ACCENT : "#e2e8f0"}`, borderRadius: 10, background: method === "paypal" ? "rgba(0,212,182,0.06)" : "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
        >
          PayPal
        </button>
      </div>

      {method === "bank" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Account Holder Name" value={holderName} onValueChange={setHolderName} placeholder="John Seller" />
          <Input label="Routing Number" value={routingNumber} onValueChange={setRoutingNumber} placeholder="110000000" maxLength={9} />
          <Input label="Account Number" value={accountNumber} onValueChange={setAccountNumber} placeholder="000123456789" />
          <Button
            color="primary"
            isLoading={setupStripe.isPending}
            isDisabled={!routingNumber || !accountNumber || !holderName}
            onPress={() => setupStripe.mutate({ routingNumber, accountNumber, accountHolderName: holderName })}
          >
            Save Bank Account
          </Button>
          {setupStripe.error && <p style={{ color: "#dc2626", fontSize: 13 }}>{setupStripe.error.message}</p>}
          {setupStripe.isSuccess && <p style={{ color: "#16a34a", fontSize: 13 }}>Bank account saved.</p>}
        </div>
      )}

      {method === "paypal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="PayPal Email" type="email" value={paypalEmail} onValueChange={setPaypalEmail} placeholder="you@paypal.com" />
          <Button
            color="primary"
            isLoading={setupPaypal.isPending}
            isDisabled={!paypalEmail}
            onPress={() => setupPaypal.mutate({ paypalEmail })}
          >
            Save PayPal
          </Button>
          {setupPaypal.error && <p style={{ color: "#dc2626", fontSize: 13 }}>{setupPaypal.error.message}</p>}
          {setupPaypal.isSuccess && <p style={{ color: "#16a34a", fontSize: 13 }}>PayPal saved.</p>}
        </div>
      )}
    </div>
  );
}
