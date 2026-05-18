# Admin Product Management: Delete + Edit

**Date:** 2026-05-17
**Branch:** feature/admin-rbac-mor
**Scope:** Super admin ability to delete or modify any product from `/admin/products`

---

## Problem

The admin products page can list and feature-toggle products but provides no way to edit or permanently remove a listing. Super admins need both capabilities for moderation and data correction.

---

## Approach

tRPC-first. Add a `superAdminProcedure` middleware to `server/trpc.ts` (SUPER_ADMIN role only). Add `deleteProduct` and `updateProduct` mutations to the admin tRPC router using that procedure. Extend the products page UI with Edit and Delete actions per row.

---

## Backend

### `server/trpc.ts`

Add `superAdminProcedure` alongside the existing `adminProcedure`:

```ts
const enforceUserIsSuperAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const role = (ctx.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
  return next({ ctx: { session: { ...ctx.session }, user: ctx.user } });
});

export const superAdminProcedure = t.procedure.use(enforceUserIsSuperAdmin);
```

### `server/routers/admin.ts` — new mutations

**`deleteProduct`** (superAdminProcedure)
- Input: `{ productId: string }`
- Writes audit log: `action: "PRODUCT_DELETED"`, `entityType: "Product"`, `entityId: productId`
- Hard deletes: `prisma.product.delete({ where: { id: productId } })`
- Returns `{ success: true }`

**`updateProduct`** (superAdminProcedure)
- Input: `{ productId, title?, description?, price?, inventory?, isActive?, category?, subcategory?, condition?, tier? }`
- Fetches current product values for audit log `previousValues`
- Updates product with provided fields only (partial update)
- Writes audit log: `action: "PRODUCT_UPDATED"`, `previousValues`, `newValues`
- Returns updated product

---

## UI — `app/admin/products/page.tsx`

### Table changes

- Add "Actions" column to the header.
- Each row renders two buttons (only visible when session user role is `SUPER_ADMIN`):
  - **Edit** — teal outline button, sets `editingProduct` state
  - **Delete** — red outline button, shows confirm dialog then fires mutation

### Delete flow

```
onClick → window.confirm("Permanently delete \"[title]\"? This cannot be undone.")
  → confirmed → deleteProduct.mutate({ productId })
  → button shows loading/disabled state during pending
  → onSuccess → utils.admin.listProducts.invalidate()
```

### Edit modal

State: `editingProduct: ProductRow | null` (null = closed).

A full-screen overlay with a centered card containing:
- Title (text input)
- Description (textarea)
- Price (number input, two decimal places)
- Inventory (number input, integer)
- isActive (checkbox)
- Category (select — ProductCategory enum values)
- Subcategory (select — ProductSubcategory enum values, optional)
- Condition (select — ProductCondition enum values)
- Tier (select — ProductTier enum values, optional)

Save button fires `updateProduct.mutate(...)` with only the changed fields. Cancel/close dismisses without saving. `onSuccess` closes modal and invalidates `listProducts`.

---

## Security

- `superAdminProcedure` is the authoritative gate. Client-side button visibility is a UX convenience only.
- ADMIN role cannot call `deleteProduct` or `updateProduct` — tRPC returns `FORBIDDEN`.
- All destructive/modifying actions produce an `AuditLog` record with the acting user's ID.

---

## Tests (TDD — tests written first)

File: `__tests__/admin-product-management.test.ts`

### `deleteProduct`
- SUPER_ADMIN can delete a product — returns `{ success: true }`
- ADMIN is rejected with FORBIDDEN
- Unauthenticated caller is rejected with UNAUTHORIZED
- Audit log record is created on successful delete

### `updateProduct`
- SUPER_ADMIN can update title, price, inventory, isActive, category, condition, tier
- Partial update — only provided fields are written
- ADMIN is rejected with FORBIDDEN
- Unauthenticated caller is rejected with UNAUTHORIZED
- Audit log record contains previousValues and newValues

---

## Out of scope

- Image upload/reorder from admin panel
- Bulk delete
- Product restore after deletion (no soft-delete — this is permanent)
- Variant editing
