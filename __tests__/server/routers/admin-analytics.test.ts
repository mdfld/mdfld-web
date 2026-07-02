import { vi, describe, it, expect } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/lib/stripe-payouts", () => ({ transferToSeller: vi.fn() }));
vi.mock("@/lib/paypal-payouts", () => ({ sendPaypalPayout: vi.fn() }));
vi.mock("@/lib/seller-balance", () => ({ getAvailableBalance: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ stripe: {} }));

import { createCallerFactory } from "@/server/trpc";
import { adminRouter } from "@/server/routers/admin";
import { TRPCError } from "@trpc/server";

const createCaller = createCallerFactory(adminRouter);

const mockPrisma = {
  user: { count: vi.fn().mockResolvedValue(0) },
  organization: { count: vi.fn().mockResolvedValue(0) },
  conversation: { count: vi.fn().mockResolvedValue(0) },
  message: { count: vi.fn().mockResolvedValue(0) },
  order: { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) },
  product: { count: vi.fn().mockResolvedValue(0) },
} as any;

describe("admin.analytics RBAC", () => {
  it("throws UNAUTHORIZED when unauthenticated", async () => {
    const caller = createCaller({ req: {} as any, res: {} as any, session: null, user: null, prisma: mockPrisma });
    await expect(caller.analytics()).rejects.toThrow(TRPCError);
    await expect(caller.analytics()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("throws FORBIDDEN for BUYER role", async () => {
    const caller = createCaller({
      req: {} as any, res: {} as any,
      session: { user: { id: "u1", role: "BUYER" } } as any,
      user: { id: "u1", role: "BUYER" } as any,
      prisma: mockPrisma,
    });
    await expect(caller.analytics()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("succeeds for ADMIN role", async () => {
    const caller = createCaller({
      req: {} as any, res: {} as any,
      session: { user: { id: "u1", role: "ADMIN" } } as any,
      user: { id: "u1", role: "ADMIN" } as any,
      prisma: mockPrisma,
    });
    await expect(caller.analytics()).resolves.toBeDefined();
  });

  it("succeeds for SUPER_ADMIN role", async () => {
    const caller = createCaller({
      req: {} as any, res: {} as any,
      session: { user: { id: "u1", role: "SUPER_ADMIN" } } as any,
      user: { id: "u1", role: "SUPER_ADMIN" } as any,
      prisma: mockPrisma,
    });
    await expect(caller.analytics()).resolves.toBeDefined();
  });
});
