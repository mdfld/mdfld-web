# Admin Product Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give SUPER_ADMIN users the ability to permanently delete or fully edit any product from `/admin/products`.

**Architecture:** Add a `superAdminProcedure` middleware to `server/trpc.ts` (SUPER_ADMIN-only gate). Add `deleteProduct` and `updateProduct` mutations to the existing `adminRouter` in `server/routers/admin.ts` using that procedure. Update the products admin page with per-row Edit (modal) and Delete (confirm + mutate) actions, visible only when `useSession()` returns role `SUPER_ADMIN`.

**Tech Stack:** tRPC v11, Prisma, Vitest, Next.js App Router, better-auth `useSession`, React `useState`, inline styles (no Tailwind).

**Branch / Worktree:** `feature/admin-rbac-mor` at `/Users/ayoola/mdfld-web/.worktrees/admin-rbac`

**Run tests from:** `/Users/ayoola/mdfld-web/.worktrees/admin-rbac`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `server/trpc.ts` | Modify | Add `superAdminProcedure` middleware + export `createCallerFactory` |
| `server/routers/admin.ts` | Modify | Add `deleteProduct` + `updateProduct` using `superAdminProcedure` |
| `__tests__/lib/adminProductMutations.test.ts` | Create | TDD tests for both mutations (written before implementation) |
| `lib/auth-client.ts` | Modify | Add `role` to `inferAdditionalFields` so `useSession` exposes it |
| `app/admin/products/page.tsx` | Modify | Edit modal + Delete button + role gate + mutations |

---

## Task 1: Add `superAdminProcedure` and `createCallerFactory` to server/trpc.ts

**Files:**
- Modify: `server/trpc.ts`

- [ ] **Step 1: Open the file and add the middleware + two exports**

In `server/trpc.ts`, after the existing `export const adminProcedure = t.procedure.use(enforceUserIsAdmin);` line at the bottom, add:

```ts
const enforceUserIsSuperAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const role = (ctx.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
  }
  return next({
    ctx: {
      session: { ...ctx.session },
      user: ctx.user,
    },
  });
});

export const superAdminProcedure = t.procedure.use(enforceUserIsSuperAdmin);
export const createCallerFactory = t.createCallerFactory;
```

- [ ] **Step 2: Verify the file compiles**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to `server/trpc.ts`.

---

## Task 2: Write failing tests for `deleteProduct`

**Files:**
- Create: `__tests__/lib/adminProductMutations.test.ts`

- [ ] **Step 1: Create the test file with mocks and deleteProduct tests**

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

const { mockAuditLogCreate, mockProductDelete, mockProductUpdate, mockProductFindUnique } =
  vi.hoisted(() => ({
    mockAuditLogCreate: vi.fn().mockResolvedValue({}),
    mockProductDelete: vi.fn().mockResolvedValue({ id: "product-1", title: "Test Boot" }),
    mockProductUpdate: vi.fn().mockResolvedValue({
      id: "product-1",
      title: "Updated Boot",
      price: 120,
      inventory: 3,
      isActive: true,
    }),
    mockProductFindUnique: vi.fn().mockResolvedValue({
      id: "product-1",
      title: "Test Boot",
      price: 100,
      inventory: 5,
      isActive: true,
      category: "BOOTS",
      subcategory: null,
      condition: "BRAND_NEW",
      tier: null,
    }),
  }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: {
      delete: mockProductDelete,
      update: mockProductUpdate,
      findUnique: mockProductFindUnique,
    },
    auditLog: {
      create: mockAuditLogCreate,
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

import { createCallerFactory } from "@/server/trpc";
import { adminRouter } from "@/server/routers/admin";

const createCaller = createCallerFactory(adminRouter);

const superAdminCtx = {
  req: {} as any,
  res: {} as any,
  session: { session: {} as any, user: { id: "sa-1", role: "SUPER_ADMIN" } } as any,
  user: { id: "sa-1", role: "SUPER_ADMIN" } as any,
  prisma: {
    product: {
      delete: mockProductDelete,
      update: mockProductUpdate,
      findUnique: mockProductFindUnique,
    },
    auditLog: { create: mockAuditLogCreate },
  } as any,
};

const adminCtx = {
  ...superAdminCtx,
  session: { session: {} as any, user: { id: "a-1", role: "ADMIN" } } as any,
  user: { id: "a-1", role: "ADMIN" } as any,
};

const noAuthCtx = {
  ...superAdminCtx,
  session: null as any,
  user: null as any,
};

describe("admin.deleteProduct", () => {
  beforeEach(() => {
    mockAuditLogCreate.mockClear();
    mockProductDelete.mockClear();
  });

  it("returns { success: true } when called by SUPER_ADMIN", async () => {
    const caller = createCaller(superAdminCtx);
    const result = await caller.deleteProduct({ productId: "product-1" });
    expect(result).toEqual({ success: true });
  });

  it("calls prisma.product.delete with the correct productId", async () => {
    const caller = createCaller(superAdminCtx);
    await caller.deleteProduct({ productId: "product-1" });
    expect(mockProductDelete).toHaveBeenCalledWith({ where: { id: "product-1" } });
  });

  it("creates an audit log entry on successful delete", async () => {
    const caller = createCaller(superAdminCtx);
    await caller.deleteProduct({ productId: "product-1" });
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "PRODUCT_DELETED",
          entityType: "Product",
          entityId: "product-1",
          userId: "sa-1",
        }),
      }),
    );
  });

  it("throws FORBIDDEN when called by ADMIN role", async () => {
    const caller = createCaller(adminCtx);
    await expect(caller.deleteProduct({ productId: "product-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws UNAUTHORIZED when called without a session", async () => {
    const caller = createCaller(noAuthCtx);
    await expect(caller.deleteProduct({ productId: "product-1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail (RED)**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && npx vitest run __tests__/lib/adminProductMutations.test.ts 2>&1 | tail -20
```

Expected: failures — `deleteProduct` does not exist on `adminRouter` yet.

---

## Task 3: Implement `deleteProduct` mutation

**Files:**
- Modify: `server/routers/admin.ts`

- [ ] **Step 1: Add `superAdminProcedure` to the import line at the top of the file**

Current import (line 3):
```ts
import { createTRPCRouter, adminProcedure, protectedProcedure } from "../trpc";
```

Replace with:
```ts
import { createTRPCRouter, adminProcedure, protectedProcedure, superAdminProcedure } from "../trpc";
```

- [ ] **Step 2: Add `deleteProduct` mutation inside `createTRPCRouter({ ... })`**

Add after the closing brace of `toggleFeatured` (around line 280):

```ts
  deleteProduct: superAdminProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "PRODUCT_DELETED",
          entityType: "Product",
          entityId: input.productId,
        },
      });
      await ctx.prisma.product.delete({ where: { id: input.productId } });
      return { success: true };
    }),
```

- [ ] **Step 3: Run the deleteProduct tests to confirm they pass (GREEN)**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && npx vitest run __tests__/lib/adminProductMutations.test.ts 2>&1 | tail -20
```

Expected: 5 tests pass, 0 fail. (The `updateProduct` describe block will error because that procedure doesn't exist yet — that's fine.)

---

## Task 4: Write failing tests for `updateProduct`

**Files:**
- Modify: `__tests__/lib/adminProductMutations.test.ts`

- [ ] **Step 1: Append the `updateProduct` describe block to the test file**

Add after the closing `});` of the `deleteProduct` describe block:

```ts
describe("admin.updateProduct", () => {
  beforeEach(() => {
    mockAuditLogCreate.mockClear();
    mockProductUpdate.mockClear();
    mockProductFindUnique.mockClear();
  });

  it("returns the updated product when called by SUPER_ADMIN", async () => {
    const caller = createCaller(superAdminCtx);
    const result = await caller.updateProduct({ productId: "product-1", title: "Updated Boot" });
    expect(result).toMatchObject({ id: "product-1" });
  });

  it("calls prisma.product.update with only the provided fields", async () => {
    const caller = createCaller(superAdminCtx);
    await caller.updateProduct({ productId: "product-1", price: 120, inventory: 3 });
    expect(mockProductUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "product-1" },
        data: expect.objectContaining({ price: 120, inventory: 3 }),
      }),
    );
    // title was not passed — must not appear in the update data
    const callData = mockProductUpdate.mock.calls[0][0].data;
    expect(callData).not.toHaveProperty("title");
  });

  it("fetches previous values and writes them to the audit log oldValues", async () => {
    const caller = createCaller(superAdminCtx);
    await caller.updateProduct({ productId: "product-1", isActive: false });
    expect(mockProductFindUnique).toHaveBeenCalledWith({ where: { id: "product-1" } });
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "PRODUCT_UPDATED",
          entityType: "Product",
          entityId: "product-1",
          userId: "sa-1",
          oldValues: expect.objectContaining({ id: "product-1" }),
          newValues: expect.objectContaining({ isActive: false }),
        }),
      }),
    );
  });

  it("throws FORBIDDEN when called by ADMIN role", async () => {
    const caller = createCaller(adminCtx);
    await expect(
      caller.updateProduct({ productId: "product-1", title: "Hack" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws UNAUTHORIZED when called without a session", async () => {
    const caller = createCaller(noAuthCtx);
    await expect(
      caller.updateProduct({ productId: "product-1", title: "Hack" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
```

- [ ] **Step 2: Run tests to confirm the new block fails (RED)**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && npx vitest run __tests__/lib/adminProductMutations.test.ts 2>&1 | tail -20
```

Expected: 5 deleteProduct tests pass, 5 updateProduct tests fail — `updateProduct` not defined yet.

---

## Task 5: Implement `updateProduct` mutation

**Files:**
- Modify: `server/routers/admin.ts`

- [ ] **Step 1: Add `updateProduct` mutation after `deleteProduct`**

```ts
  updateProduct: superAdminProcedure
    .input(
      z.object({
        productId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().positive().optional(),
        inventory: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
        category: z
          .enum([
            "JERSEYS",
            "BOOTS",
            "FOOTBALLS",
            "TRADING_CARDS",
            "GOALKEEPER_GLOVES",
            "SHIN_GUARDS",
            "TRAINING_EQUIPMENT",
            "ACCESSORIES",
          ])
          .optional(),
        subcategory: z.string().optional(),
        condition: z
          .enum([
            "BRAND_NEW",
            "NEW_WITH_TAGS",
            "NEW_WITHOUT_TAGS",
            "USED_LIKE_NEW",
            "USED_GOOD",
            "USED_FAIR",
          ])
          .optional(),
        tier: z.enum(["ELITE", "PRO", "ACADEMY", "CLUB"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { productId, ...rest } = input;
      const updateData = Object.fromEntries(
        Object.entries(rest).filter(([, v]) => v !== undefined),
      );

      const previous = await ctx.prisma.product.findUnique({ where: { id: productId } });

      const updated = await ctx.prisma.product.update({
        where: { id: productId },
        data: updateData as any,
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "PRODUCT_UPDATED",
          entityType: "Product",
          entityId: productId,
          oldValues: previous as any,
          newValues: updateData,
        },
      });

      return updated;
    }),
```

- [ ] **Step 2: Run all mutation tests to confirm GREEN**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && npx vitest run __tests__/lib/adminProductMutations.test.ts 2>&1 | tail -20
```

Expected: 10/10 tests pass.

- [ ] **Step 3: Run the full test suite to check for regressions**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && npx vitest run 2>&1 | tail -20
```

Expected: all existing tests still pass.

---

## Task 6: Update auth-client.ts to expose `role` in useSession

**Files:**
- Modify: `lib/auth-client.ts`

The `inferAdditionalFields` list currently omits `role`. Without this, `useSession().data?.user?.role` returns `undefined` on the client, so the UI role gate won't work.

- [ ] **Step 1: Add `role` field to `inferAdditionalFields` in `lib/auth-client.ts`**

Find the `inferAdditionalFields({ user: { ... } })` call. Inside the `user` object, add `role` after `kycStatus`:

```ts
kycStatus: { type: "string", required: false },
role: { type: "string", required: false },
```

The full `inferAdditionalFields` call should then look like:

```ts
inferAdditionalFields({
  user: {
    bio: { type: "string", required: false },
    website: { type: "string", required: false },
    location: { type: "string", required: false },
    banner: { type: "string", required: false },
    trustScore: { type: "number", required: false },
    isVerifiedSeller: { type: "boolean", required: false },
    phoneNumber: { type: "string", required: false },
    dateOfBirth: { type: "string", required: false },
    kycStatus: { type: "string", required: false },
    role: { type: "string", required: false },
  },
}),
```

---

## Task 7: Update the admin products page UI

**Files:**
- Modify: `app/admin/products/page.tsx`

This is the largest change. Replace the entire file with the version below. It preserves the existing list/filter/featured-toggle behaviour and adds: `useSession` role check, Edit and Delete action buttons per row (SUPER_ADMIN only), the delete confirm flow, and the edit modal.

- [ ] **Step 1: Replace `app/admin/products/page.tsx` with the full updated version**

```tsx
"use client";
import { trpc } from "@/lib/trpc-client";
import { useSession } from "@/lib/auth-client";
import { useState } from "react";

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
                "Orders", "Reports", "Featured", "Active",
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
```

- [ ] **Step 2: Run the full test suite one more time to confirm nothing regressed**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && npx vitest run 2>&1 | tail -20
```

Expected: all tests pass.

---

## Task 8: One big commit

All changes go in a single commit per session policy.

- [ ] **Step 1: Stage all changed files explicitly**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && git add \
  server/trpc.ts \
  server/routers/admin.ts \
  __tests__/lib/adminProductMutations.test.ts \
  lib/auth-client.ts \
  app/admin/products/page.tsx
```

- [ ] **Step 2: Verify staged files and diff**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && git status && git diff --staged --stat
```

Expected: exactly the 5 files above staged, no unintended files.

- [ ] **Step 3: Commit**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && git commit -m "feat: super admin delete and edit products from admin panel

- Add superAdminProcedure middleware to server/trpc.ts (SUPER_ADMIN only)
- Export createCallerFactory from server/trpc.ts for test callers
- Add deleteProduct mutation with hard delete + audit log
- Add updateProduct mutation with partial field update + audit log (oldValues/newValues)
- Add role field to inferAdditionalFields in auth-client.ts
- Update /admin/products page with Edit modal and Delete action (SUPER_ADMIN only)
- 10 new tests covering auth, FORBIDDEN, success, partial update, audit log"
```

- [ ] **Step 4: Confirm commit succeeded**

```bash
cd /Users/ayoola/mdfld-web/.worktrees/admin-rbac && git log --oneline -3
```

Expected: your new commit appears at the top.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| `superAdminProcedure` in trpc.ts | Task 1 |
| `deleteProduct` — hard delete + audit log | Task 3 |
| `updateProduct` — partial update + audit log with old/new values | Task 5 |
| SUPER_ADMIN gate (server-enforced) | Tasks 1, 3, 5 |
| ADMIN rejected with FORBIDDEN | Tests in Tasks 2, 4 |
| Unauthenticated rejected with UNAUTHORIZED | Tests in Tasks 2, 4 |
| Edit modal pre-filled with current values | Task 7 |
| Delete with confirm dialog | Task 7 |
| Role-gated buttons (UI only, SUPER_ADMIN) | Task 7 |
| `useSession` exposes role on client | Task 6 |
| One big commit | Task 8 |
| Audit log uses `oldValues`/`newValues` (AuditLog model field names) | Task 5 |

**Placeholder scan:** None found — all steps contain complete code.

**Type consistency:** `superAdminProcedure` defined in Task 1, imported in Task 3 and Task 5. `createCallerFactory` defined in Task 1, imported in test file created in Task 2 and extended in Task 4. Form state type `FormState` defined and used consistently throughout Task 7.
