import Redis from "ioredis";

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    if (times > 3) {
      // Maximum retry attempts reached
      throw new Error("Redis connection failed after 3 attempts");
    }
    return Math.min(times * 50, 2000);
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

// Create Redis clients
const redisPublisher = new Redis(redisConfig);
const redisSubscriber = new Redis(redisConfig);
const redisCache = new Redis(redisConfig);

// Handle connection errors
const handleRedisError = (_client: string) => (err: Error) => {
  // Redis connection error
  throw err;
};

redisPublisher.on("error", handleRedisError("Publisher"));
redisSubscriber.on("error", handleRedisError("Subscriber"));
redisCache.on("error", handleRedisError("Cache"));

// Redis clients initialized

// Define Redis channels
export const REDIS_CHANNELS = {
  CHAT: "chat",
  MESSAGE_STATUS: "message_status",
  TYPING: "typing",
  USER_PRESENCE: "user_presence",
};

// Publish a message to a conversation
export async function publishMessage(
  conversationId: string,
  message: any,
): Promise<void> {
  const channel = `${REDIS_CHANNELS.CHAT}:${conversationId}`;
  await redisPublisher.publish(channel, JSON.stringify(message));
}

// Publish message status update
export async function publishMessageStatus(
  conversationId: string,
  messageId: string,
  status: string,
): Promise<void> {
  const channel = `${REDIS_CHANNELS.MESSAGE_STATUS}:${conversationId}`;
  await redisPublisher.publish(
    channel,
    JSON.stringify({ messageId, status, timestamp: Date.now() }),
  );
}

// Publish typing status
export async function publishTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean,
): Promise<void> {
  const channel = `${REDIS_CHANNELS.TYPING}:${conversationId}`;
  await redisPublisher.publish(
    channel,
    JSON.stringify({ userId, isTyping, timestamp: Date.now() }),
  );
}

// Cache a message
export async function cacheMessage(
  conversationId: string,
  message: any,
): Promise<void> {
  const key = `messages:${conversationId}`;
  await redisCache.lpush(key, JSON.stringify(message));
  await redisCache.ltrim(key, 0, 99); // Keep last 100 messages
  await redisCache.expire(key, 300); // Expire after 5 minutes
}

// Get cached messages
export async function getCachedMessages(
  conversationId: string,
): Promise<any[]> {
  const key = `messages:${conversationId}`;
  const messages = await redisCache.lrange(key, 0, -1);
  return messages.map((m) => JSON.parse(m)).reverse();
}

// User presence
export async function setUserPresence(
  userId: string,
  status:
    | "online"
    | "offline"
    | "away"
    | "dnd"
    | "focus"
    | "vacation"
    | string = "online",
): Promise<void> {
  const key = `presence:${userId}`;
  await redisCache.setex(key, 300, status); // 5 minute TTL
  await redisPublisher.publish(
    REDIS_CHANNELS.USER_PRESENCE,
    JSON.stringify({ userId, status, timestamp: Date.now() }),
  );
}

export async function getUserPresence(userId: string): Promise<boolean> {
  const presence = await redisCache.get(`presence:${userId}`);
  return !!presence;
}

// Graceful shutdown
export async function closeRedisConnections() {
  await Promise.all([
    redisPublisher.quit(),
    redisSubscriber.quit(),
    redisCache.quit(),
  ]);
}

// Export redis cache instance for direct access when needed
export { redisCache as redis };
