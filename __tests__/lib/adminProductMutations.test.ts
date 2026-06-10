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

vi.mock("@/lib/stripe", () => ({ stripe: {} }));

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
