import { describe, it, expect } from "vitest";
import { signWsToken, verifyWsToken } from "../../lib/ws-token";

const SECRET = "test-secret-key";

describe("ws-token", () => {
  it("signs and verifies a token, returning the payload", () => {
    const token = signWsToken(
      { userId: "user_1", channel: "chat:conv_1" },
      SECRET,
    );
    const payload = verifyWsToken(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("user_1");
    expect(payload!.channel).toBe("chat:conv_1");
    expect(payload!.exp).toBeGreaterThan(Date.now());
  });

  it("rejects a token signed with a different secret", () => {
    const token = signWsToken(
      { userId: "user_1", channel: "chat:conv_1" },
      "other-secret",
    );
    expect(verifyWsToken(token, SECRET)).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const token = signWsToken(
      { userId: "user_1", channel: "chat:conv_1" },
      SECRET,
    );
    const [, sig] = token.split(".");
    const forged =
      Buffer.from(
        JSON.stringify({
          userId: "attacker",
          channel: "chat:conv_1",
          exp: Date.now() + 60000,
        }),
      ).toString("base64url") +
      "." +
      sig;
    expect(verifyWsToken(forged, SECRET)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = signWsToken(
      { userId: "user_1", channel: "chat:conv_1", expiresInMs: -1000 },
      SECRET,
    );
    expect(verifyWsToken(token, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifyWsToken("", SECRET)).toBeNull();
    expect(verifyWsToken("garbage", SECRET)).toBeNull();
    expect(verifyWsToken("a.b.c", SECRET)).toBeNull();
    expect(verifyWsToken("notbase64!.sig", SECRET)).toBeNull();
  });
});

describe("authorizeWsConnection", () => {
  const { authorizeWsConnection } = require("../../lib/ws-token");

  function tokenFor(userId: string, channel: string) {
    return signWsToken({ userId, channel }, SECRET);
  }

  it("authorizes a chat connection with a matching token", () => {
    const token = tokenFor("u1", "chat:conv_1");
    const result = authorizeWsConnection("/chat/conv_1", token, SECRET);
    expect(result).toEqual(
      expect.objectContaining({ userId: "u1", channel: "chat:conv_1" }),
    );
  });

  it("authorizes a notifications connection for the token owner", () => {
    const token = tokenFor("u1", "notifications:u1");
    const result = authorizeWsConnection("/notifications/u1", token, SECRET);
    expect(result).toEqual(
      expect.objectContaining({ userId: "u1", channel: "notifications:u1" }),
    );
  });

  it("rejects a token issued for a different conversation", () => {
    const token = tokenFor("u1", "chat:conv_1");
    expect(authorizeWsConnection("/chat/conv_2", token, SECRET)).toBeNull();
  });

  it("rejects a notifications connection for another user", () => {
    const token = tokenFor("u1", "notifications:u1");
    expect(authorizeWsConnection("/notifications/u2", token, SECRET)).toBeNull();
  });

  it("rejects missing token, bad paths, and unknown types", () => {
    const token = tokenFor("u1", "chat:conv_1");
    expect(authorizeWsConnection("/chat/conv_1", null, SECRET)).toBeNull();
    expect(authorizeWsConnection("/chat/", token, SECRET)).toBeNull();
    expect(authorizeWsConnection("/other/conv_1", token, SECRET)).toBeNull();
  });
});
