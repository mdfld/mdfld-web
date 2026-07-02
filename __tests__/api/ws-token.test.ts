import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockGetSession, mockFindUnique } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversationParticipant: {
      findUnique: mockFindUnique,
    },
  },
}));

process.env.BETTER_AUTH_SECRET = "test-secret-key";

import { GET } from "../../app/api/ws-token/route";
import { NextRequest } from "next/server";
import { verifyWsToken } from "../../lib/ws-token";

describe("GET /api/ws-token", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockFindUnique.mockReset();
  });

  it("returns 401 when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/ws-token?type=notifications");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for an unknown type", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    const req = new NextRequest("http://localhost/api/ws-token?type=bogus");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("issues a notifications token bound to the session user", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    const req = new NextRequest("http://localhost/api/ws-token?type=notifications");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const { token } = await res.json();
    const payload = verifyWsToken(token, "test-secret-key");
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("u1");
    expect(payload!.channel).toBe("notifications:u1");
  });

  it("returns 400 for chat type without conversationId", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    const req = new NextRequest("http://localhost/api/ws-token?type=chat");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not a conversation participant", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue(null);
    const req = new NextRequest(
      "http://localhost/api/ws-token?type=chat&conversationId=conv_1",
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: {
        conversationId_userId: {
          conversationId: "conv_1",
          userId: "u1",
        },
      },
    });
  });

  it("issues a chat token when user is a participant", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "u1" } });
    mockFindUnique.mockResolvedValue({ conversationId: "conv_1", userId: "u1" });
    const req = new NextRequest(
      "http://localhost/api/ws-token?type=chat&conversationId=conv_1",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const { token } = await res.json();
    const payload = verifyWsToken(token, "test-secret-key");
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("u1");
    expect(payload!.channel).toBe("chat:conv_1");
  });
});
