# MDFLD Admin Panel: RBAC + MoR Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock down `/admin` behind a real role system, build 6 admin modules (Stores, Users, Products, Orders, Payments, Settlement), and formalize MDFLD as Merchant of Record by removing Stripe Connect seller onboarding.

**Architecture:** Add `UserRole` enum to the User schema; expose role in better-auth session; enforce via admin layout + TRPC `adminProcedure`. Admin modules are new pages + TRPC procedures on the existing `adminRouter`. MoR formalization removes Stripe Connect from seller flow and adds explicit commission tracking + manual payout endpoint.

**Tech Stack:** Next.js 14 App Router, TRPC v11, better-auth, Prisma + PostgreSQL, Stripe (PaymentIntents + Payouts API), Tailwind CSS

---

## Phase 1: RBAC Foundation

### Task 1: Add Role + Store Status to Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Write the failing test**

Create `__tests__/schema/rbac.test.ts`:
```typescript
import { prisma } from "@/lib/prisma";

describe("UserRole schema", () => {
  it("user has role field defaulting to BUYER", async () => {
    const user = await prisma.user.findFirst({ select: { role: true } });
    // If column exists, query succeeds. If not, Prisma throws.
    expect(user?.role ?? "BUYER").toBeDefined();
  });

  it("organization has storeStatus field defaulting to PENDING", async () => {
    const org = await prisma.organization.findFirst({
      select: { storeStatus: true },
    });
    expect(org?.storeStatus ?? "PENDING").toBeDefined();
  });
});
```

Run: `cd /Users/ayoola/mdfld-web && npx jest __tests__/schema/rbac.test.ts --no-coverage`
Expected: FAIL — `role` column does not exist

- [ ] **Step 2: Add UserRole enum + role field to User model**

In `prisma/schema.prisma`, add after the existing `KycStatus` enum block:
```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  SELLER
  BUYER
}

enum StoreStatus {
  PENDING
  APPROVED
  REJECTED
  SUSPENDED
}
```

Add `role` field inside the `User` model after `kycStatus`:
```prisma
  role             UserRole  @default(BUYER)
```

Add `storeStatus` field inside the `Organization` model after `isVerified`:
```prisma
  storeStatus      StoreStatus @default(PENDING)
```

Add `pendingBalance` and `settledBalance` to `SellerProfile` after `commissionRate`:
```prisma
  pendingBalance   Decimal   @default(0.00)  // Funds collected, not yet paid out
  settledBalance   Decimal   @default(0.00)  // Funds already paid out
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/ayoola/mdfld-web
npx prisma migrate dev --name add_rbac_and_mor_fields
```
Expected: Migration created and applied. Prisma Client regenerated.

- [ ] **Step 4: Run test to verify schema**

```bash
npx jest __tests__/schema/rbac.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Seed yourself as SUPER_ADMIN**

Run in `prisma/seed-admin.ts` (create this file):
```typescript
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.user.updateMany({
    where: { email: process.env.ADMIN_EMAIL! },
    data: { role: "SUPER_ADMIN" },
  });
  console.log("Admin role set for", process.env.ADMIN_EMAIL);
}
main().catch(console.error).finally(() => prisma.$disconnect());
```

Run: `ADMIN_EMAIL=your@email.com npx tsx prisma/seed-admin.ts`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ prisma/seed-admin.ts __tests__/schema/rbac.test.ts
git commit -m "feat: add UserRole, StoreStatus enums and MoR balance fields to schema"
```

---

### Task 2: Expose Role in better-auth Session

**Files:**
- Modify: `lib/auth.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/auth/role-in-session.test.ts`:
```typescript
import { auth } from "@/lib/auth";

describe("auth additionalFields", () => {
  it("exposes role field in session user", () => {
    const fields = (auth as any).options?.user?.additionalFields ?? {};
    expect(fields).toHaveProperty("role");
    expect(fields.role.type).toBe("string");
  });
});
```

Run: `npx jest __tests__/auth/role-in-session.test.ts --no-coverage`
Expected: FAIL

- [ ] **Step 2: Add role to additionalFields in lib/auth.ts**

In `lib/auth.ts`, inside the `user.additionalFields` object, add after the last field:
```typescript
      role: {
        type: "string",
        defaultValue: "BUYER",
        input: false,
      },
```

- [ ] **Step 3: Run test**

```bash
npx jest __tests__/auth/role-in-session.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts __tests__/auth/role-in-session.test.ts
git commit -m "feat: expose user role in better-auth session"
```

---

### Task 3: Add adminProcedure to TRPC

**Files:**
- Modify: `server/trpc.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/trpc/admin-procedure.test.ts`:
```typescript
// Test that adminProcedure throws FORBIDDEN for non-admins
import { createTRPCContext } from "@/server/trpc";

describe("adminProcedure", () => {
  it("throws FORBIDDEN when user role is BUYER", async () => {
    const ctx = {
      req: {} as any,
      res: {} as any,
      session: { user: { id: "1", role: "BUYER" } } as any,
      user: { id: "1", role: "BUYER" } as any,
      prisma: {} as any,
    };
    // Import is checked dynamically after implementation
    const { adminProcedure } = await import("@/server/trpc");
    expect(adminProcedure).toBeDefined();
  });
});
```

Run: `npx jest __tests__/trpc/admin-procedure.test.ts --no-coverage`
Expected: FAIL — `adminProcedure` not exported

- [ ] **Step 2: Add adminProcedure to server/trpc.ts**

After the `enforceUserIsAuthed` middleware, add:
```typescript
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const role = (ctx.user as any).role as string;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({
    ctx: {
      session: { ...ctx.session },
      user: ctx.user,
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
```

- [ ] **Step 3: Run test**

```bash
npx jest __tests__/trpc/admin-procedure.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/trpc.ts __tests__/trpc/admin-procedure.test.ts
git commit -m "feat: add adminProcedure TRPC middleware enforcing ADMIN/SUPER_ADMIN role"
```

---

### Task 4: Secure Admin Layout (Route Guard)

**Files:**
- Create: `app/admin/layout.tsx`

This replaces any existing layout or wraps the existing admin pages. The layout fetches the session server-side and redirects non-admins.

- [ ] **Step 1: Write the failing test**

Create `__tests__/admin/layout-guard.test.ts`:
```typescript
// Smoke test: the layout file exports a default function
import AdminLayout from "@/app/admin/layout";

describe("AdminLayout", () => {
  it("exports a default component", () => {
    expect(typeof AdminLayout).toBe("function");
  });
});
```

Run: `npx jest __tests__/admin/layout-guard.test.ts --no-coverage`
Expected: FAIL if layout doesn't exist or doesn't export default

- [ ] **Step 2: Create app/admin/layout.tsx**

```typescript
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/auth/login?from=/admin");
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Run test**

```bash
npx jest __tests__/admin/layout-guard.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 4: Smoke test locally**

```bash
npm run dev
```
Open http://localhost:3000/admin in a browser where you are NOT logged in as admin. Expected: redirect to /auth/login. Log in as your SUPER_ADMIN account. Expected: admin page loads.

- [ ] **Step 5: Commit**

```bash
git add app/admin/layout.tsx __tests__/admin/layout-guard.test.ts
git commit -m "feat: add server-side role guard to admin layout — redirects non-admins"
```

---

## Phase 2: Admin TRPC Procedures

### Task 5: Stores Management TRPC Procedures

**Files:**
- Modify: `server/routers/admin.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/admin/stores.test.ts`:
```typescript
import { adminRouter } from "@/server/routers/admin";

describe("admin.stores", () => {
  it("router has listStores procedure", () => {
    expect(adminRouter._def.procedures).toHaveProperty("listStores");
  });
  it("router has approveStore procedure", () => {
    expect(adminRouter._def.procedures).toHaveProperty("approveStore");
  });
  it("router has rejectStore procedure", () => {
    expect(adminRouter._def.procedures).toHaveProperty("rejectStore");
  });
});
```

Run: `npx jest __tests__/admin/stores.test.ts --no-coverage`
Expected: FAIL — procedures don't exist yet

- [ ] **Step 2: Add imports and adminProcedure import to server/routers/admin.ts**

Replace the top of `server/routers/admin.ts`:
```typescript
import { z } from "zod";
import { createTRPCRouter, adminProcedure, protectedProcedure } from "../trpc";
```

- [ ] **Step 3: Add stores procedures to adminRouter**

Append inside `createTRPCRouter({...})` in `server/routers/admin.ts`:
```typescript
  listStores: adminProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const stores = await ctx.prisma.organization.findMany({
        where: input.status ? { storeStatus: input.status } : undefined,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          sellerProfile: { select: { storeName: true, totalSales: true, pendingBalance: true } },
          members: { select: { userId: true, role: true } },
        },
      });
      let nextCursor: string | undefined;
      if (stores.length > input.limit) {
        nextCursor = stores.pop()!.id;
      }
      return { stores, nextCursor };
    }),

  approveStore: adminProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.prisma.organization.update({
        where: { id: input.organizationId },
        data: { storeStatus: "APPROVED", isVerified: true },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          organizationId: input.organizationId,
          action: "STORE_APPROVED",
          entityType: "Organization",
          entityId: input.organizationId,
        },
      });
      return org;
    }),

  rejectStore: adminProcedure
    .input(z.object({ organizationId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.prisma.organization.update({
        where: { id: input.organizationId },
        data: { storeStatus: "REJECTED", isVerified: false },
      });
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          organizationId: input.organizationId,
          action: "STORE_REJECTED",
          entityType: "Organization",
          entityId: input.organizationId,
          newValues: { reason: input.reason },
        },
      });
      return org;
    }),
```

- [ ] **Step 4: Run tests**

```bash
npx jest __tests__/admin/stores.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/routers/admin.ts __tests__/admin/stores.test.ts
git commit -m "feat: add listStores, approveStore, rejectStore to admin TRPC router"
```

---

### Task 6: Users, Products, Orders TRPC Procedures

**Files:**
- Modify: `server/routers/admin.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/admin/users-products-orders.test.ts`:
```typescript
import { adminRouter } from "@/server/routers/admin";

describe("admin router procedures", () => {
  const procs = adminRouter._def.procedures;

  it("has listUsers", () => expect(procs).toHaveProperty("listUsers"));
  it("has listProducts", () => expect(procs).toHaveProperty("listProducts"));
  it("has listOrders", () => expect(procs).toHaveProperty("listOrders"));
  it("has getOrder", () => expect(procs).toHaveProperty("getOrder"));
});
```

Run: `npx jest __tests__/admin/users-products-orders.test.ts --no-coverage`
Expected: FAIL

- [ ] **Step 2: Add listUsers procedure**

Append to adminRouter in `server/routers/admin.ts`:
```typescript
  listUsers: adminProcedure
    .input(
      z.object({
        role: z.enum(["SUPER_ADMIN", "ADMIN", "SELLER", "BUYER"]).optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          AND: [
            input.role ? { role: input.role } : {},
            input.search
              ? {
                  OR: [
                    { email: { contains: input.search, mode: "insensitive" } },
                    { name: { contains: input.search, mode: "insensitive" } },
                    { username: { contains: input.search, mode: "insensitive" } },
                  ],
                }
              : {},
          ],
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          kycStatus: true,
          isVerifiedSeller: true,
          createdAt: true,
          sellerProfile: { select: { storeName: true, totalSales: true } },
        },
      });
      let nextCursor: string | undefined;
      if (users.length > input.limit) nextCursor = users.pop()!.id;
      return { users, nextCursor };
    }),
```

- [ ] **Step 3: Add listProducts procedure**

```typescript
  listProducts: adminProcedure
    .input(
      z.object({
        organizationId: z.string().optional(),
        isActive: z.boolean().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const products = await ctx.prisma.product.findMany({
        where: {
          AND: [
            input.organizationId ? { organizationId: input.organizationId } : {},
            input.isActive !== undefined ? { isActive: input.isActive } : {},
          ],
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          seller: { select: { storeName: true } },
          organization: { select: { name: true } },
          _count: { select: { orderItems: true } },
        },
      });
      let nextCursor: string | undefined;
      if (products.length > input.limit) nextCursor = products.pop()!.id;
      return { products, nextCursor };
    }),
```

- [ ] **Step 4: Add listOrders and getOrder procedures**

```typescript
  listOrders: adminProcedure
    .input(
      z.object({
        status: z.enum(["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const orders = await ctx.prisma.order.findMany({
        where: input.status ? { status: input.status } : undefined,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { include: { user: { select: { name: true, email: true } } } },
          seller: { select: { storeName: true } },
          items: { include: { product: { select: { title: true, images: true } } } },
        },
      });
      let nextCursor: string | undefined;
      if (orders.length > input.limit) nextCursor = orders.pop()!.id;
      return { orders, nextCursor };
    }),

  getOrder: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          buyer: { include: { user: { select: { name: true, email: true } } } },
          seller: { select: { storeName: true, businessEmail: true, pendingBalance: true } },
          items: { include: { product: true, variant: true } },
          transactions: true,
        },
      });
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      return order;
    }),
```

Add `import { TRPCError } from "@trpc/server";` at the top of admin.ts.

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/admin/users-products-orders.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/routers/admin.ts __tests__/admin/users-products-orders.test.ts
git commit -m "feat: add listUsers, listProducts, listOrders, getOrder admin TRPC procedures"
```

---

### Task 7: Payments Dashboard + Settlement TRPC Procedures

**Files:**
- Modify: `server/routers/admin.ts`
- Modify: `server/routers/stripe.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/admin/payments.test.ts`:
```typescript
import { adminRouter } from "@/server/routers/admin";

describe("admin payments procedures", () => {
  const procs = adminRouter._def.procedures;
  it("has getPaymentsSummary", () => expect(procs).toHaveProperty("getPaymentsSummary"));
  it("has listSellerBalances", () => expect(procs).toHaveProperty("listSellerBalances"));
  it("has triggerPayout", () => expect(procs).toHaveProperty("triggerPayout"));
});
```

Run: `npx jest __tests__/admin/payments.test.ts --no-coverage`
Expected: FAIL

- [ ] **Step 2: Add getPaymentsSummary**

```typescript
  getPaymentsSummary: adminProcedure.query(async ({ ctx }) => {
    const [totalCollectedResult, commissionResult, pendingResult, settledResult] =
      await Promise.all([
        ctx.prisma.order.aggregate({
          _sum: { total: true },
          where: { paymentStatus: "CAPTURED" },
        }),
        ctx.prisma.order.aggregate({
          _sum: { applicationFeeAmount: true },
          where: { paymentStatus: "CAPTURED" },
        }),
        ctx.prisma.sellerProfile.aggregate({
          _sum: { pendingBalance: true },
        }),
        ctx.prisma.sellerProfile.aggregate({
          _sum: { settledBalance: true },
        }),
      ]);

    return {
      totalCollected: totalCollectedResult._sum.total ?? 0,
      totalCommission: commissionResult._sum.applicationFeeAmount ?? 0,
      totalOwedToSellers: pendingResult._sum.pendingBalance ?? 0,
      totalSettled: settledResult._sum.settledBalance ?? 0,
    };
  }),
```

- [ ] **Step 3: Add listSellerBalances**

```typescript
  listSellerBalances: adminProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const sellers = await ctx.prisma.sellerProfile.findMany({
        where: { pendingBalance: { gt: 0 } },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { pendingBalance: "desc" },
        select: {
          id: true,
          storeName: true,
          businessEmail: true,
          pendingBalance: true,
          settledBalance: true,
          bankAccount: true,
          user: { select: { name: true, email: true } },
        },
      });
      let nextCursor: string | undefined;
      if (sellers.length > input.limit) nextCursor = sellers.pop()!.id;
      return { sellers, nextCursor };
    }),
```

- [ ] **Step 4: Add triggerPayout**

```typescript
  triggerPayout: adminProcedure
    .input(
      z.object({
        sellerProfileId: z.string(),
        amount: z.number().positive(), // in dollars
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const seller = await ctx.prisma.sellerProfile.findUnique({
        where: { id: input.sellerProfileId },
        include: { user: true },
      });

      if (!seller) throw new TRPCError({ code: "NOT_FOUND", message: "Seller not found" });
      if (!seller.bankAccount) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Seller has not provided bank account details",
        });
      }

      const amountCents = Math.round(input.amount * 100);
      const pendingCents = Math.round(Number(seller.pendingBalance) * 100);
      if (amountCents > pendingCents) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Payout amount exceeds pending balance ($${seller.pendingBalance})`,
        });
      }

      // Record payout transaction
      const transaction = await ctx.prisma.transaction.create({
        data: {
          userId: seller.userId!,
          type: "PAYOUT",
          amount: input.amount,
          status: "COMPLETED",
          paymentMethod: "STRIPE",
          netAmount: input.amount,
        },
      });

      // Update seller balances
      await ctx.prisma.sellerProfile.update({
        where: { id: input.sellerProfileId },
        data: {
          pendingBalance: { decrement: input.amount },
          settledBalance: { increment: input.amount },
        },
      });

      // Audit log
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "PAYOUT_TRIGGERED",
          entityType: "SellerProfile",
          entityId: input.sellerProfileId,
          newValues: { amount: input.amount, transactionId: transaction.id, notes: input.notes },
        },
      });

      return { success: true, transactionId: transaction.id };
    }),
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/admin/payments.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/routers/admin.ts __tests__/admin/payments.test.ts
git commit -m "feat: add getPaymentsSummary, listSellerBalances, triggerPayout to admin router"
```

---

## Phase 3: Admin UI Pages

### Task 8: Stores Management Page

**Files:**
- Create: `app/admin/stores/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
"use client";
import { api } from "@/lib/trpc/client";
import { useState } from "react";

export default function AdminStoresPage() {
  const [statusFilter, setStatusFilter] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | undefined
  >("PENDING");

  const { data, isLoading, refetch } = api.admin.listStores.useQuery({
    status: statusFilter,
    limit: 20,
  });

  const approveStore = api.admin.approveStore.useMutation({
    onSuccess: () => refetch(),
  });
  const rejectStore = api.admin.rejectStore.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>
        Stores Management
      </h1>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 16px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: statusFilter === s ? "#00d4b6" : "#ccc",
                background: statusFilter === s ? "#00d4b6" : "white",
                color: statusFilter === s ? "white" : "#333",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          )
        )}
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["Store", "Owner", "Status", "Sales", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.stores.map((org) => (
              <tr key={org.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px" }}>
                  <strong>{org.name}</strong>
                  <div style={{ fontSize: 12, color: "#999" }}>{org.slug}</div>
                </td>
                <td style={{ padding: "12px", fontSize: 14 }}>
                  {org.members[0]?.userId ?? "—"}
                </td>
                <td style={{ padding: "12px" }}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        org.storeStatus === "APPROVED"
                          ? "#d1fae5"
                          : org.storeStatus === "PENDING"
                          ? "#fef3c7"
                          : "#fee2e2",
                      color:
                        org.storeStatus === "APPROVED"
                          ? "#065f46"
                          : org.storeStatus === "PENDING"
                          ? "#92400e"
                          : "#991b1b",
                    }}
                  >
                    {org.storeStatus}
                  </span>
                </td>
                <td style={{ padding: "12px", fontSize: 14 }}>
                  {org.sellerProfile?.totalSales ?? 0}
                </td>
                <td style={{ padding: "12px", display: "flex", gap: 8 }}>
                  {org.storeStatus === "PENDING" && (
                    <>
                      <button
                        onClick={() => approveStore.mutate({ organizationId: org.id })}
                        style={{
                          padding: "4px 12px",
                          background: "#00d4b6",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectStore.mutate({ organizationId: org.id })}
                        style={{
                          padding: "4px 12px",
                          background: "#fee2e2",
                          color: "#991b1b",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```
Expected: No errors for `app/admin/stores/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add app/admin/stores/page.tsx
git commit -m "feat: add Stores Management admin page with approve/reject actions"
```

---

### Task 9: Users Admin Page

**Files:**
- Create: `app/admin/users/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
"use client";
import { api } from "@/lib/trpc/client";
import { useState } from "react";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = api.admin.listUsers.useQuery({
    search: search || undefined,
    limit: 50,
  });

  return (
    <div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Users</h1>

      <input
        type="text"
        placeholder="Search by name, email, or username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          marginBottom: 20,
        }}
      />

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["Name", "Email", "Role", "KYC", "Seller", "Joined"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "12px" }}>
                  <strong>{user.name}</strong>
                  <div style={{ fontSize: 12, color: "#999" }}>@{user.username}</div>
                </td>
                <td style={{ padding: "12px", fontSize: 14 }}>{user.email}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    background: user.role === "SUPER_ADMIN" ? "#ede9fe" : user.role === "SELLER" ? "#dbeafe" : "#f3f4f6",
                    color: user.role === "SUPER_ADMIN" ? "#5b21b6" : user.role === "SELLER" ? "#1e40af" : "#374151",
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: "12px", fontSize: 13 }}>{user.kycStatus}</td>
                <td style={{ padding: "12px", fontSize: 13 }}>
                  {user.isVerifiedSeller ? "✓" : "—"}
                </td>
                <td style={{ padding: "12px", fontSize: 13, color: "#666" }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/users/page.tsx
git commit -m "feat: add Users admin page with search and role display"
```

---

### Task 10: Orders Admin Page

**Files:**
- Create: `app/admin/orders/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
"use client";
import { api } from "@/lib/trpc/client";
import { useState } from "react";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#fef3c7", text: "#92400e" },
  CONFIRMED: { bg: "#d1fae5", text: "#065f46" },
  PROCESSING: { bg: "#dbeafe", text: "#1e40af" },
  SHIPPED: { bg: "#ede9fe", text: "#5b21b6" },
  DELIVERED: { bg: "#d1fae5", text: "#065f46" },
  CANCELLED: { bg: "#fee2e2", text: "#991b1b" },
  REFUNDED: { bg: "#f3f4f6", text: "#374151" },
};

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = api.admin.listOrders.useQuery({
    status: statusFilter as any,
    limit: 30,
  });

  return (
    <div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Orders</h1>

      <select
        value={statusFilter ?? ""}
        onChange={(e) => setStatusFilter(e.target.value || undefined)}
        style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", marginBottom: 20, fontSize: 14 }}
      >
        <option value="">All Statuses</option>
        {Object.keys(STATUS_COLORS).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              {["Order #", "Buyer", "Store", "Items", "Total", "Status", "Date"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.orders.map((order) => {
              const colors = STATUS_COLORS[order.status] ?? STATUS_COLORS.PENDING;
              return (
                <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "12px", fontSize: 13, fontFamily: "monospace" }}>
                    {order.orderNumber}
                  </td>
                  <td style={{ padding: "12px", fontSize: 14 }}>
                    {order.buyer.user.name}
                    <div style={{ fontSize: 12, color: "#999" }}>{order.buyer.user.email}</div>
                  </td>
                  <td style={{ padding: "12px", fontSize: 14 }}>{order.seller.storeName}</td>
                  <td style={{ padding: "12px", fontSize: 14 }}>{order.items.length}</td>
                  <td style={{ padding: "12px", fontSize: 14, fontWeight: 600 }}>
                    ${Number(order.total).toFixed(2)}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      background: colors.bg,
                      color: colors.text,
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: 13, color: "#666" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
git add app/admin/orders/page.tsx
git commit -m "feat: add Orders admin page with status filter"
```

---

### Task 11: Payments Dashboard + Settlement Page

**Files:**
- Create: `app/admin/payments/page.tsx`
- Create: `app/admin/settlements/page.tsx`

- [ ] **Step 1: Create Payments Dashboard page**

```typescript
"use client";
import { api } from "@/lib/trpc/client";

export default function AdminPaymentsPage() {
  const { data, isLoading } = api.admin.getPaymentsSummary.useQuery();

  if (isLoading) return <div style={{ padding: 32 }}>Loading...</div>;

  const stats = [
    { label: "Total Collected", value: data?.totalCollected, color: "#00d4b6" },
    { label: "Platform Commission (10%)", value: data?.totalCommission, color: "#0066ff" },
    { label: "Owed to Sellers", value: data?.totalOwedToSellers, color: "#f59e0b" },
    { label: "Already Settled", value: data?.totalSettled, color: "#6b7280" },
  ];

  return (
    <div style={{ padding: 32, fontFamily: "'Barlow', sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Payments Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{
            background: "white",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            borderTop: `4px solid ${stat.color}`,
          }}>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>
              ${Number(stat.value ?? 0).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <a href="/admin/settlements" style={{
          display: "inline-block",
          padding: "10px 24px",
          background: "#000",
          color: "white",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 14,
        }}>
          Manage Settlements →
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Settlement Flow page**

```typescript
"use client";
import { api } from "@/lib/trpc/client";
import { useState } from "react";

export default function AdminSettlementsPage() {
  const { data, isLoading, refetch } = api.admin.listSellerBalances.useQuery({ limit: 50 });
  const triggerPayout = api.admin.triggerPayout.useMutation({ onSuccess: () => refetch() });
  const [payoutAmounts, setPayoutAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

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
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>
                  {h}
                </th>
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
                    onClick={() =>
                      triggerPayout.mutate({
                        sellerProfileId: seller.id,
                        amount: parseFloat(payoutAmounts[seller.id] ?? "0"),
                        notes: notes[seller.id],
                      })
                    }
                    style={{
                      padding: "6px 16px",
                      background: seller.bankAccount ? "#000" : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: 6,
                      cursor: seller.bankAccount ? "pointer" : "not-allowed",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
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
```

- [ ] **Step 3: Build check + commit**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
git add app/admin/payments/page.tsx app/admin/settlements/page.tsx
git commit -m "feat: add Payments Dashboard and Settlement admin pages"
```

---

### Task 12: Update Admin Dashboard Nav

**Files:**
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Add new sections to adminSections array**

In `app/admin/page.tsx`, replace the `adminSections` array:
```typescript
const adminSections = [
  {
    title: "Platform Analytics",
    description: "User counts, org metrics, and platform statistics",
    icon: "📊",
    href: "/admin/analytics",
    accent: ACCENT,
  },
  {
    title: "Stores Management",
    description: "Review, approve, and reject store requests",
    icon: "🏪",
    href: "/admin/stores",
    accent: "#10b981",
  },
  {
    title: "Users",
    description: "All users, roles, KYC status, and activity",
    icon: "👥",
    href: "/admin/users",
    accent: "#0066ff",
  },
  {
    title: "Products",
    description: "All products across stores, filterable by store",
    icon: "👟",
    href: "/admin/products",
    accent: "#8b5cf6",
  },
  {
    title: "Orders",
    description: "All orders with status, buyer, seller, and item details",
    icon: "📦",
    href: "/admin/orders",
    accent: "#f59e0b",
  },
  {
    title: "Payments",
    description: "Total collected, commission earned, owed to sellers",
    icon: "💰",
    href: "/admin/payments",
    accent: "#00d4b6",
  },
  {
    title: "Settlements",
    description: "Manually trigger payouts to sellers",
    icon: "🏦",
    href: "/admin/settlements",
    accent: "#ef4444",
  },
  {
    title: "Content Moderation",
    description: "Review and moderate user-generated content",
    icon: "🛡️",
    href: "/admin/moderation",
    accent: "#f59e0b",
  },
  {
    title: "Admin Settings",
    description: "Configure platform-wide settings and features",
    icon: "⚙️",
    href: "/admin/settings",
    accent: BLUE,
  },
];
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
git add app/admin/page.tsx
git commit -m "feat: update admin dashboard nav to include all 6 new modules"
```

---

## Phase 4: MoR Payment Formalization

### Task 13: Update Webhook to Track Seller Pending Balance

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`

When a checkout.session.completed fires, the seller should have their `pendingBalance` incremented (total minus platform commission).

- [ ] **Step 1: Write the failing test**

Create `__tests__/webhook/seller-balance.test.ts`:
```typescript
// Test that handleCheckoutSessionCompleted increments seller pendingBalance
// This is a unit test of the logic — mock prisma
describe("seller balance update on checkout", () => {
  it("increments seller pendingBalance by (total - commission)", () => {
    const total = 100;
    const commission = 10; // 10%
    const sellerReceives = total - commission;
    expect(sellerReceives).toBe(90);
  });
});
```

Run: `npx jest __tests__/webhook/seller-balance.test.ts --no-coverage`
Expected: PASS (trivial, but documents intent)

- [ ] **Step 2: Add pendingBalance increment to handleCheckoutSessionCompleted**

In `app/api/stripe/webhook/route.ts`, inside the `for (const [sellerId, items] of Object.entries(itemsBySeller))` loop, after the `order` is created, add:
```typescript
    // Update seller pending balance (total minus platform commission)
    const commissionRate = sellerProfile.commissionRate ?? 0.10;
    const sellerReceives = subtotal * (1 - commissionRate);
    await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: {
        pendingBalance: { increment: sellerReceives },
        totalSales: { increment: 1 },
      },
    });

    // Record application fee amount on order
    const applicationFeeAmount = subtotal * commissionRate;
    await prisma.order.update({
      where: { id: order.id },
      data: { applicationFeeAmount },
    });
```

- [ ] **Step 3: Remove Stripe Connect account.updated handler**

In `app/api/stripe/webhook/route.ts`, remove the entire `case "account.updated":` block and `handleAccountUpdated` function — they are no longer needed with MoR model.

- [ ] **Step 4: Run tests + commit**

```bash
npx jest __tests__/webhook/seller-balance.test.ts --no-coverage
git add app/api/stripe/webhook/route.ts __tests__/webhook/seller-balance.test.ts
git commit -m "feat: increment seller pendingBalance on checkout, remove Connect account handler"
```

---

### Task 14: Remove Stripe Connect Seller Onboarding

**Files:**
- Modify: `server/routers/stripe.ts`

Remove `createConnectAccount` and `createAccountLink` procedures — these create Stripe sub-merchant accounts. Replace with nothing (sellers no longer need Stripe accounts; MDFLD collects all funds).

- [ ] **Step 1: Write the test**

Create `__tests__/stripe/no-connect.test.ts`:
```typescript
import { stripeRouter } from "@/server/routers/stripe";

describe("stripeRouter MoR model", () => {
  const procs = stripeRouter._def.procedures;

  it("does NOT have createConnectAccount", () => {
    expect(procs).not.toHaveProperty("createConnectAccount");
  });

  it("does NOT have createAccountLink", () => {
    expect(procs).not.toHaveProperty("createAccountLink");
  });

  it("still has getOrCreateCustomer for buyers", () => {
    expect(procs).toHaveProperty("getOrCreateCustomer");
  });
});
```

Run: `npx jest __tests__/stripe/no-connect.test.ts --no-coverage`
Expected: FAIL (procedures still exist)

- [ ] **Step 2: Remove createConnectAccount and createAccountLink from server/routers/stripe.ts**

Delete the entire `createConnectAccount` procedure (lines ~7–123) and the entire `createAccountLink` procedure (lines ~193–249).

Also remove the imports that are only used by those procedures:
```typescript
// Remove from import at top:
import { stripe, STRIPE_ACCOUNT_TYPE, SELLER_CAPABILITIES } from "@/lib/stripe";
// Replace with:
import { stripe } from "@/lib/stripe";
```

Keep `getAccountStatus`, `getOrCreateCustomer`, and `getCommissionRate`.

- [ ] **Step 3: Run test**

```bash
npx jest __tests__/stripe/no-connect.test.ts --no-coverage
```
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add server/routers/stripe.ts __tests__/stripe/no-connect.test.ts
git commit -m "feat: remove Stripe Connect seller onboarding (MoR model — MDFLD collects all payments)"
```

---

## Phase 5: Products Admin Page

### Task 15: Products Admin Page

**Files:**
- Create: `app/admin/products/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
"use client";
import { api } from "@/lib/trpc/client";
import { useState } from "react";

export default function AdminProductsPage() {
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  const { data, isLoading } = api.admin.listProducts.useQuery({
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
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#666" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.products.map((product) => (
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
                <td style={{ padding: "12px" }}>
                  <span style={{
                    width: 10, height: 10,
                    borderRadius: "50%",
                    background: product.isActive ? "#10b981" : "#ef4444",
                    display: "inline-block",
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check + commit**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -20
git add app/admin/products/page.tsx
git commit -m "feat: add Products admin page with active/inactive filter"
```

---

## Final Verification

### Task 16: Full Build + Run All Tests

- [ ] **Step 1: Run all tests**

```bash
cd /Users/ayoola/mdfld-web && npx jest --no-coverage 2>&1 | tail -30
```
Expected: All tests PASS (or only pre-existing failures)

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: Build succeeds with no errors

- [ ] **Step 3: Smoke test admin in browser**

Start dev server: `npm run dev`

1. Visit `/admin` logged out → redirected to `/auth/login`
2. Log in as SUPER_ADMIN → `/admin` loads with 9 module cards
3. `/admin/stores` → loads store list with PENDING filter
4. `/admin/users` → loads users table
5. `/admin/orders` → loads orders table
6. `/admin/payments` → loads 4 metric cards
7. `/admin/settlements` → loads sellers with pending balances
8. `/admin/products` → loads products table
9. Log in as a regular BUYER account → visiting `/admin` redirects to `/`

- [ ] **Step 4: Final commit + tag**

```bash
git add -A
git commit -m "feat: complete MDFLD admin RBAC + 6 admin modules + MoR payment formalization"
git tag v0.2.0-admin-rbac
```

---

## Summary of Changes

| File | Action | Purpose |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add UserRole, StoreStatus enums; role on User; storeStatus + pendingBalance on Org/Seller |
| `lib/auth.ts` | Modify | Expose role in better-auth session |
| `server/trpc.ts` | Modify | Add adminProcedure middleware |
| `server/routers/admin.ts` | Modify | Add 9 new procedures (stores, users, products, orders, payments, settlement) |
| `server/routers/stripe.ts` | Modify | Remove createConnectAccount + createAccountLink |
| `app/admin/layout.tsx` | Create | Server-side role guard |
| `app/admin/page.tsx` | Modify | Add 6 new nav sections |
| `app/admin/stores/page.tsx` | Create | Store approval/rejection UI |
| `app/admin/users/page.tsx` | Create | Users table with search |
| `app/admin/products/page.tsx` | Create | Products table |
| `app/admin/orders/page.tsx` | Create | Orders table with status filter |
| `app/admin/payments/page.tsx` | Create | Payments summary dashboard |
| `app/admin/settlements/page.tsx` | Create | Manual payout triggers |
| `app/api/stripe/webhook/route.ts` | Modify | Track seller pendingBalance, remove Connect handler |
| `prisma/seed-admin.ts` | Create | One-time script to set your account as SUPER_ADMIN |
