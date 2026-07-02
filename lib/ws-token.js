// Shared between the Next.js app (token issuing) and websocket-server.js
// (token verification). Kept as CommonJS so the standalone ws server can
// require it without a build step.
const crypto = require("crypto");

const DEFAULT_TTL_MS = 60 * 1000;

/**
 * @param {{ userId: string, channel: string, expiresInMs?: number }} input
 * @param {string} secret
 * @returns {string} token in the form base64url(payload).base64url(hmac)
 */
function signWsToken(input, secret) {
  const payload = {
    userId: input.userId,
    channel: input.channel,
    exp: Date.now() + (input.expiresInMs ?? DEFAULT_TTL_MS),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

/**
 * @param {string} token
 * @param {string} secret
 * @returns {{ userId: string, channel: string, exp: number } | null}
 */
function verifyWsToken(token, secret) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  const sigBuf = Buffer.from(signature, "base64url");
  const expectedBuf = Buffer.from(expected, "base64url");
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (
    !payload ||
    typeof payload.userId !== "string" ||
    typeof payload.channel !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp < Date.now()
  ) {
    return null;
  }
  return payload;
}

/**
 * Decide whether a websocket connection may be established.
 * @param {string} pathname e.g. "/chat/<conversationId>" or "/notifications/<userId>"
 * @param {string | null} token
 * @param {string} secret
 * @returns {{ userId: string, channel: string, exp: number } | null}
 */
function authorizeWsConnection(pathname, token, secret) {
  if (!token) return null;
  const parts = String(pathname).split("/").filter(Boolean);
  const [type, resourceId] = parts;
  if (parts.length !== 2 || !resourceId) return null;
  if (type !== "chat" && type !== "notifications") return null;

  const payload = verifyWsToken(token, secret);
  if (!payload) return null;
  if (payload.channel !== `${type}:${resourceId}`) return null;
  return payload;
}

module.exports = { signWsToken, verifyWsToken, authorizeWsConnection };
