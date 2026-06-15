"use client";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";
import { VERIFICATION_STATUS_OPTIONS, getVerificationStatusOption } from "@/lib/verification-badge";

const CATEGORIES = [
  "JERSEYS", "BOOTS", "FOOTBALLS", "TRADING_CARDS",
  "GOALKEEPER_GLOVES", "SHIN_GUARDS", "TRAINING_EQUIPMENT", "ACCESSORIES",
] as const;

const CONDITIONS = [
  "BRAND_NEW", "NEW_WITH_TAGS", "NEW_WITHOUT_TAGS",
  "USED_LIKE_NEW", "USED_GOOD", "USED_FAIR",
] as const;

const TIERS = ["ELITE", "PRO", "ACADEMY", "CLUB", ""] as const;

type FormState = {
  title: string;
  description: string;
  price: string;
  inventory: string;
  isActive: boolean;
  category: string;
  subcategory: string;
  condition: string;
  tier: string;
};

export default function AdminProductsPage() {
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const utils = trpc.useUtils();
  const { data: sessionData } = useSession();
  const isSuperAdmin = (sessionData?.user as any)?.role === "SUPER_ADMIN";

  const { data, isLoading } = trpc.admin.listProducts.useQuery({
    isActive: activeFilter,
    limit: 50,
  });

  const toggleFeatured = trpc.admin.toggleFeatured.useMutation({
    onSuccess: () => utils.admin.listProducts.invalidate(),
  });

  const setVerification = trpc.admin.setProductVerification.useMutation({
    onSuccess: () => utils.admin.listProducts.invalidate(),
  });

  const deleteProduct = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => utils.admin.listProducts.invalidate(),
  });

  const updateProduct = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      utils.admin.listProducts.invalidate();
      setEditingProduct(null);
      setForm(null);
    },
  });

  function openEdit(product: any) {
    setEditingProduct(product);
    setForm({
      title: product.title ?? "",
      description: product.description ?? "",
      price: String(Number(product.price)),
      inventory: String(product.inventory ?? 0),
      isActive: product.isActive ?? true,
      category: product.category ?? "BOOTS",
      subcategory: product.subcategory ?? "",
      condition: product.condition ?? "BRAND_NEW",
      tier: product.tier ?? "",
    });
  }

  function closeEdit() {
    setEditingProduct(null);
    setForm(null);
  }

  function handleDelete(product: any) {
    if (!window.confirm(`Permanently delete "${product.title}"? This cannot be undone.`)) return;
    deleteProduct.mutate({ productId: product.id });
  }

  function handleSave() {
    if (!editingProduct || !form) return;
    updateProduct.mutate({
      productId: editingProduct.id,
      title: form.title,
      description: form.description,
      price: Number(form.price),
      inventory: Number(form.inventory),
      isActive: form.isActive,
      category: form.category as any,
      subcategory: form.subcategory || undefined,
      condition: form.condition as any,
      tier: (form.tier || undefined) as any,
    });
  }

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
              padding: "6px 16px", borderRadius: 6, border: "1px solid",
              borderColor: activeFilter === opt.value ? "#00d4b6" : "#ccc",
              background: activeFilter === opt.value ? "#00d4b6" : "white",
              color: activeFilter === opt.value ? "white" : "#333",
              fontWeight: 600, cursor: "pointer",
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
              {[
                "Product", "Store", "Category", "Price", "Inventory",
                "Orders", "Reports", "Featured", "Verification", "Active",
                ...(isSuperAdmin ? ["Actions"] : []),
              ].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.products as any[] | undefined)?.map((product) => (
              <tr key={product.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {product.images[0] && (
                      <img
                        src={product.images[0]}
                        alt=""
                        style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                      />
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
                <td style={{ padding: "12px", fontSize: 14 }}>
                  <span style={{ color: product.reportCount > 0 ? "#ef4444" : "#999", fontWeight: product.reportCount > 0 ? 700 : 400 }}>
                    {product.reportCount}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <button
                    onClick={() => toggleFeatured.mutate({ productId: product.id, featured: !product.featured })}
                    style={{
                      padding: "4px 12px", borderRadius: 4, border: "1px solid",
                      borderColor: product.featured ? "#00d4b6" : "#ccc",
                      background: product.featured ? "rgba(0,212,182,0.1)" : "transparent",
                      color: product.featured ? "#00d4b6" : "#999",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {product.featured ? "Featured" : "Set Featured"}
                  </button>
                </td>
                <td style={{ padding: "12px" }}>
                  {isSuperAdmin ? (
                    <select
                      value={product.verificationStatus}
                      onChange={(e) =>
                        setVerification.mutate({
                          productId: product.id,
                          verificationStatus: e.target.value as
                            | "UNVERIFIED"
                            | "FAN_MADE"
                            | "VERIFIED_AUTHENTIC"
                            | "VERIFIED_REPLICA",
                        })
                      }
                      style={{
                        padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600,
                        border: "1px solid #ccc", background: "transparent",
                        color: getVerificationStatusOption(product.verificationStatus).color,
                      }}
                    >
                      {VERIFICATION_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      style={{
                        fontSize: 12, fontWeight: 600,
                        color: getVerificationStatusOption(product.verificationStatus).color,
                      }}
                    >
                      {getVerificationStatusOption(product.verificationStatus).label}
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: product.isActive ? "#10b981" : "#ef4444",
                      display: "inline-block",
                    }}
                  />
                </td>
                {isSuperAdmin && (
                  <td style={{ padding: "12px", display: "flex", gap: 8 }}>
                    <button
                      onClick={() => openEdit(product)}
                      style={{
                        padding: "4px 10px", borderRadius: 4, border: "1px solid #00d4b6",
                        background: "transparent", color: "#00d4b6",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      disabled={deleteProduct.isPending}
                      style={{
                        padding: "4px 10px", borderRadius: 4, border: "1px solid #ef4444",
                        background: "transparent", color: "#ef4444",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        opacity: deleteProduct.isPending ? 0.5 : 1,
                      }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Edit Modal */}
      {editingProduct && form && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div
            style={{
              background: "white", borderRadius: 12, padding: 32,
              width: 560, maxHeight: "90vh", overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>
              Edit Product
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label style={labelStyle}>
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ ...labelStyle, flex: 1 }}>
                  Price ($)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={inputStyle}
                  />
                </label>
                <label style={{ ...labelStyle, flex: 1 }}>
                  Inventory
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.inventory}
                    onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Condition
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  style={inputStyle}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Tier (optional)
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">— none —</option>
                  {TIERS.filter(Boolean).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label style={{ ...labelStyle, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                Active (visible to buyers)
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "flex-end" }}>
              <button
                onClick={closeEdit}
                style={{
                  padding: "8px 20px", borderRadius: 6, border: "1px solid #ccc",
                  background: "white", color: "#333", fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateProduct.isPending}
                style={{
                  padding: "8px 20px", borderRadius: 6, border: "none",
                  background: updateProduct.isPending ? "#ccc" : "#00d4b6",
                  color: "white", fontWeight: 700, cursor: updateProduct.isPending ? "default" : "pointer",
                }}
              >
                {updateProduct.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {updateProduct.isError && (
              <p style={{ color: "#ef4444", marginTop: 12, fontSize: 13 }}>
                Error saving. Please try again.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#444",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "1px solid #ddd",
  fontSize: 14,
  fontFamily: "'Barlow', sans-serif",
  width: "100%",
  boxSizing: "border-box",
};
