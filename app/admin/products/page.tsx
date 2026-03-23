"use client";
import { trpc } from "@/lib/trpc-client";
import { useState } from "react";

export default function AdminProductsPage() {
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading } = trpc.admin.listProducts.useQuery({
    isActive: activeFilter,
    limit: 50,
  });

  return (
    <div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Products</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          { label: "All", value: undefined },
          { label: "Active", value: true },
          { label: "Inactive", value: false },
        ].map((opt) => (
          <button
            key={opt.label}
            onClick={() => setActiveFilter(opt.value)}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid",
              borderColor: activeFilter === opt.value ? "#00d4b6" : "#ccc",
              background: activeFilter === opt.value ? "#00d4b6" : "white",
              color: activeFilter === opt.value ? "white" : "#333",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["Product", "Store", "Category", "Price", "Inventory", "Orders", "Active"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.products as any[] | undefined)?.map((product) => (
              <tr key={product.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {product.images[0] && (
                      <img src={product.images[0]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                    )}
                    <div>
                      <strong style={{ fontSize: 14 }}>{product.title}</strong>
                      <div style={{ fontSize: 12, color: "#999" }}>{product.brand}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px", fontSize: 14 }}>{product.seller.storeName}</td>
                <td style={{ padding: "12px", fontSize: 13, color: "#666" }}>{product.category}</td>
                <td style={{ padding: "12px", fontWeight: 600 }}>${Number(product.price).toFixed(2)}</td>
                <td style={{ padding: "12px", fontSize: 14 }}>{product.inventory}</td>
                <td style={{ padding: "12px", fontSize: 14 }}>{product._count.orderItems}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: product.isActive ? "#10b981" : "#ef4444", display: "inline-block" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
