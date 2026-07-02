const WebSocket = require("ws");
const http = require("http");
const Redis = require("ioredis");
const { authorizeWsConnection } = require("./lib/ws-token");

const WS_TOKEN_SECRET = process.env.BETTER_AUTH_SECRET;
if (!WS_TOKEN_SECRET) {
  console.error("BETTER_AUTH_SECRET is required to start the websocket server");
  process.exit(1);
}

// Create Redis clients
const redisSubscriber = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active connections
const connections = new Map();

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const connectionType = pathParts[0]; // 'chat' or 'notifications'
  const resourceId = pathParts[1]; // conversationId or userId

  // Tokens are short-lived HMAC credentials issued by /api/ws-token after a
  // session and (for chat) conversation-membership check.
  const auth = authorizeWsConnection(
    url.pathname,
    url.searchParams.get("token"),
    WS_TOKEN_SECRET,
  );
  if (!auth) {
    ws.close(1008, "Unauthorized");
    return;
  }
  const userId = auth.userId;

  if (connectionType === "chat") {
    const conversationId = resourceId;

    // Store connection
    if (!connections.has(conversationId)) {
      connections.set(conversationId, new Map());
    }
    connections.get(conversationId).set(userId, ws);

    // Subscribe to Redis channel for this conversation
    const channel = `chat:new_message:${conversationId}`;
    redisSubscriber.subscribe(channel);
  } else if (connectionType === "notifications") {
    // Store notification connection
    const notificationKey = `notifications:${userId}`;
    if (!connections.has(notificationKey)) {
      connections.set(notificationKey, new Map());
    }
    connections.get(notificationKey).set("main", ws);

    // Subscribe to Redis channel for notifications
    redisSubscriber.subscribe(notificationKey);
  }

  // Clients never send over this socket: messages, typing indicators, and
  // read receipts all go through authenticated tRPC procedures which publish
  // to Redis. Anything a client sends here is ignored.

  // Handle disconnect
  ws.on("close", () => {
    if (connectionType === "chat") {
      const conversationId = resourceId;

      const conversationConnections = connections.get(conversationId);
      if (conversationConnections) {
        conversationConnections.delete(userId);
        if (conversationConnections.size === 0) {
          connections.delete(conversationId);
          redisSubscriber.unsubscribe(`chat:new_message:${conversationId}`);
        }
      }
    } else if (connectionType === "notifications") {
      const notificationKey = `notifications:${userId}`;
      connections.delete(notificationKey);
      redisSubscriber.unsubscribe(notificationKey);
    }
  });

  // Send initial connection success
  if (connectionType === "chat") {
    ws.send(
      JSON.stringify({ type: "connected", conversationId: resourceId, userId }),
    );
  } else if (connectionType === "notifications") {
    ws.send(JSON.stringify({ type: "connected", userId }));
  }
});

// Handle Redis messages
redisSubscriber.on("message", (channel, message) => {
  // Handle chat messages
  if (channel.startsWith("chat:new_message:")) {
    const conversationId = channel.split(":").pop();
    const conversationConnections = connections.get(conversationId);

    if (conversationConnections) {
      conversationConnections.forEach((connection) => {
        if (connection.readyState === WebSocket.OPEN) {
          connection.send(message);
        }
      });
    }
  }

  // Handle notifications
  else if (channel.startsWith("notifications:")) {
    const userId = channel.split(":").pop();
    const notificationConnections = connections.get(`notifications:${userId}`);

    if (notificationConnections) {
      notificationConnections.forEach((connection) => {
        if (connection.readyState === WebSocket.OPEN) {
          connection.send(message);
        }
      });
    }
  }
});

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
