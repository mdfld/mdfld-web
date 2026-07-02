import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockUserFindMany } = vi.hoisted(() => ({
  mockUserFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: mockUserFindMany,
    },
  },
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

import { createCallerFactory } from "@/server/trpc";
import { userRouter } from "@/server/routers/user";

const createCaller = createCallerFactory(userRouter);

const publicCtx = { req: {} as any, res: {} as any, session: null, user: null, prisma: { user: { findMany: mockUserFindMany } } as any };

describe("user.publicSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns users matching name or username", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "u1", name: "Ayoola Test", username: "ayoola", image: null },
    ]);
    const caller = createCaller(publicCtx);
    const result = await caller.publicSearch({ query: "ayo" });
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe("ayoola");
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { name: { contains: "ayo", mode: "insensitive" } },
            { username: { contains: "ayo", mode: "insensitive" } },
          ]),
        }),
        take: 5,
      })
    );
  });

  it("does not expose email in results", async () => {
    mockUserFindMany.mockResolvedValue([
      { id: "u1", name: "Test User", username: "testuser", image: null },
    ]);
    const caller = createCaller(publicCtx);
    const result = await caller.publicSearch({ query: "test" });
    expect((result[0] as any).email).toBeUndefined();
    // Verify the DB query itself does not select email
    const callArg = mockUserFindMany.mock.calls[0][0];
    expect(callArg.select).not.toHaveProperty("email");
  });

  it("rejects query shorter than 2 chars", async () => {
    const caller = createCaller(publicCtx);
    await expect(caller.publicSearch({ query: "a" })).rejects.toThrow();
  });

  it("returns empty array when no users found", async () => {
    mockUserFindMany.mockResolvedValue([]);
    const caller = createCaller(publicCtx);
    const result = await caller.publicSearch({ query: "zzz" });
    expect(result).toEqual([]);
  });
});
