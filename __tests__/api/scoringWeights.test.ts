import { vi, describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Hoisted mocks so they can be referenced inside vi.mock factories
const { mockUpsert, mockResetCache } = vi.hoisted(() => ({
  mockUpsert: vi.fn().mockResolvedValue({}),
  mockResetCache: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@prisma/client", () => {
  function PrismaClient() {
    return {
      platformSetting: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: mockUpsert,
      },
    };
  }
  return { PrismaClient };
});

vi.mock("@/lib/scoring/getScoringWeights", () => ({
  getScoringWeights: vi.fn(),
  _resetCache: mockResetCache,
}));

import { PATCH } from "../../app/api/admin/scoring-weights/route";
import { auth } from "@/lib/auth";

const VALID_WEIGHTS = {
  recencyWeight: 0.35,
  relevanceWeight: 0.30,
  trustWeight: 0.20,
  priceWeight: 0.15,
};

function makePatchRequest(body: object) {
  return new NextRequest("http://localhost/api/admin/scoring-weights", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("PATCH /api/admin/scoring-weights", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    mockUpsert.mockClear();
    mockResetCache.mockClear();
  });

  it("returns 401 when unauthenticated", async () => {
    const res = await PATCH(makePatchRequest(VALID_WEIGHTS));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user has ADMIN role (not SUPER_ADMIN)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", role: "ADMIN" },
      session: {},
    } as any);
    const res = await PATCH(makePatchRequest(VALID_WEIGHTS));
    expect(res.status).toBe(403);
  });

  it("returns 403 when user has BUYER role", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", role: "BUYER" },
      session: {},
    } as any);
    const res = await PATCH(makePatchRequest(VALID_WEIGHTS));
    expect(res.status).toBe(403);
  });

  it("returns 400 when weights sum to more than 1.0", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", role: "SUPER_ADMIN" },
      session: {},
    } as any);
    const badWeights = {
      recencyWeight: 0.5,
      relevanceWeight: 0.5,
      trustWeight: 0.5,
      priceWeight: 0.5,
    };
    const res = await PATCH(makePatchRequest(badWeights));
    expect(res.status).toBe(400);
  });

  it("returns 400 when weights sum to less than 1.0", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", role: "SUPER_ADMIN" },
      session: {},
    } as any);
    const badWeights = {
      recencyWeight: 0.1,
      relevanceWeight: 0.1,
      trustWeight: 0.1,
      priceWeight: 0.1,
    };
    const res = await PATCH(makePatchRequest(badWeights));
    expect(res.status).toBe(400);
  });

  it("returns 200, calls upsert, and resets the scoring cache for valid weights", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", role: "SUPER_ADMIN" },
      session: {},
    } as any);
    const res = await PATCH(makePatchRequest(VALID_WEIGHTS));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledOnce();
    expect(mockResetCache).toHaveBeenCalledOnce();
  });

  it("persists the correct weight values in platform_settings", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", role: "SUPER_ADMIN" },
      session: {},
    } as any);
    await PATCH(makePatchRequest(VALID_WEIGHTS));
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          value: VALID_WEIGHTS,
        }),
      }),
    );
  });
});
