import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const mockSession = { user: { id: "user-1" } };

const makeRequest = (method: string, body?: object) =>
  new Request("http://localhost/api/onboarding", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

describe("GET /api/onboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    expect(res.status).toBe(401);
  });

  it("returns empty state when user has no onboardingState", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: null } as any);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ buyer: [], seller: [], tours: [], sellerOptIn: false });
  });

  it("returns existing state when present", async () => {
    const existing = { buyer: ["verify-email"], seller: [], tours: ["dashboard"] };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: existing } as any);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    const data = await res.json();
    expect(data).toEqual({ ...existing, sellerOptIn: false });
  });
});

describe("PATCH /api/onboarding", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/onboarding/route");
    const res = await PATCH(makeRequest("PATCH", { step: "browse-shop", stepType: "buyer" }) as any);
    expect(res.status).toBe(401);
  });

  it("appends a buyer step to the buyer array", async () => {
    const current = { buyer: ["verify-email"], seller: [], tours: [], sellerOptIn: false };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    const res = await PATCH(makeRequest("PATCH", { step: "browse-shop", stepType: "buyer" }) as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: ["verify-email", "browse-shop"], seller: [], tours: [], sellerOptIn: false },
        },
      }),
    );
  });

  it("does not duplicate an already-completed buyer step", async () => {
    const current = { buyer: ["verify-email", "browse-shop"], seller: [], tours: [], sellerOptIn: false };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    await PATCH(makeRequest("PATCH", { step: "browse-shop", stepType: "buyer" }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: ["verify-email", "browse-shop"], seller: [], tours: [], sellerOptIn: false },
        },
      }),
    );
  });

  it("appends a seller step to the seller array", async () => {
    const current = { buyer: [], seller: [], tours: [], sellerOptIn: false };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    await PATCH(makeRequest("PATCH", { step: "org-name-bio", stepType: "seller" }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: [], seller: ["org-name-bio"], tours: [], sellerOptIn: false },
        },
      }),
    );
  });

  it("appends a tour to the tours array", async () => {
    const current = { buyer: [], seller: [], tours: [], sellerOptIn: false };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    await PATCH(makeRequest("PATCH", { tour: "dashboard" }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { onboardingState: { buyer: [], seller: [], tours: ["dashboard"], sellerOptIn: false } },
      }),
    );
  });
});

describe("GET /api/onboarding — sellerOptIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns sellerOptIn: false when absent from stored state", async () => {
    const existing = { buyer: [], seller: [], tours: [] };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: existing } as any);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    const data = await res.json();
    expect(data.sellerOptIn).toBe(false);
  });

  it("returns sellerOptIn: true when set in stored state", async () => {
    const existing = { buyer: [], seller: [], tours: [], sellerOptIn: true };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: existing } as any);
    const { GET } = await import("@/app/api/onboarding/route");
    const res = await GET(makeRequest("GET") as any);
    const data = await res.json();
    expect(data.sellerOptIn).toBe(true);
  });
});

describe("PATCH /api/onboarding — sellerOptIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets sellerOptIn to true when patched", async () => {
    const current = { buyer: [], seller: [], tours: [], sellerOptIn: false };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    const res = await PATCH(makeRequest("PATCH", { sellerOptIn: true }) as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: [], seller: [], tours: [], sellerOptIn: true },
        },
      }),
    );
  });

  it("does not unset sellerOptIn when not included in patch body", async () => {
    const current = { buyer: [], seller: [], tours: [], sellerOptIn: true };
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ onboardingState: current } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({} as any);
    const { PATCH } = await import("@/app/api/onboarding/route");
    await PATCH(makeRequest("PATCH", { tour: "dashboard" }) as any);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          onboardingState: { buyer: [], seller: [], tours: ["dashboard"], sellerOptIn: true },
        },
      }),
    );
  });
});
