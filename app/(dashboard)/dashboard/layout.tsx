"use client";

import "@/styles/globals.css";
import StoreComplianceGate from "@/components/dashboard/store-compliance-gate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden">
      <StoreComplianceGate>{children}</StoreComplianceGate>
    </div>
  );
}
