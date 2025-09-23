import "server-only";
import { createHash, randomBytes } from "crypto";

export interface EncryptedMessage {
  content: string;
  nonce: string;
}

export class SimpleE2EE {
  // Simple XOR-based encryption for demo purposes
  // In production, use a proper library like libsodium-wrappers

  private static xorStrings(str: string, key: string): string {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      result += String.fromCharCode(
        str.charCodeAt(i) ^ key.charCodeAt(i % key.length),
      );
    }
    return result;
  }

  // Derive a shared key from two user IDs
  static deriveSharedKey(userId1: string, userId2: string): string {
    // Sort IDs to ensure same key regardless of order
    const combined = [userId1, userId2].sort().join(":");
    const secret = process.env.CHAT_ENCRYPTION_KEY || "default-chat-key";

    // Create a deterministic key
    return createHash("sha256")
      .update(combined + secret)
      .digest("hex");
  }

  // Encrypt a message (simple implementation)
  static encryptMessage(content: string, sharedKey: string): EncryptedMessage {
    const nonce = randomBytes(16).toString("hex");
    const keyWithNonce = createHash("sha256")
      .update(sharedKey + nonce)
      .digest("hex");

    // Simple XOR encryption
    const encrypted = Buffer.from(
      this.xorStrings(content, keyWithNonce),
    ).toString("base64");

    return {
      content: encrypted,
      nonce,
    };
  }

  // Decrypt a message
  static decryptMessage(
    encrypted: EncryptedMessage,
    sharedKey: string,
  ): string {
    const keyWithNonce = createHash("sha256")
      .update(sharedKey + encrypted.nonce)
      .digest("hex");

    // Decode from base64 and XOR decrypt
    const decoded = Buffer.from(encrypted.content, "base64").toString();
    return this.xorStrings(decoded, keyWithNonce);
  }

  // Helper to encrypt for multiple recipients
  static encryptForConversation(
    content: string,
    senderId: string,
    recipientIds: string[],
  ): Record<string, string> {
    const encrypted: Record<string, string> = {};

    // Include sender in recipients so they can read their own messages
    const allRecipients = [...new Set([senderId, ...recipientIds])];

    for (const recipientId of allRecipients) {
      const sharedKey = this.deriveSharedKey(senderId, recipientId);
      const encryptedMessage = this.encryptMessage(content, sharedKey);
      encrypted[recipientId] = JSON.stringify(encryptedMessage);
    }

    return encrypted;
  }

  // Helper to decrypt a message for a user
  static decryptForUser(
    encryptedVersions: string | Record<string, string>,
    userId: string,
    senderId: string,
  ): string | null {
    try {
      // Handle both string and object formats
      let versions: Record<string, string>;

      if (typeof encryptedVersions === "string") {
        try {
          versions = JSON.parse(encryptedVersions);
        } catch {
          // If it's not JSON, return as-is (plain text)
          return encryptedVersions;
        }
      } else {
        versions = encryptedVersions;
      }

      // Get the user's encrypted version
      const userVersion = versions[userId];
      if (!userVersion) {
        return null;
      }

      // If it's a plain string, return it
      if (!userVersion.includes("{")) {
        return userVersion;
      }

      // Parse and decrypt
      const encrypted = JSON.parse(userVersion) as EncryptedMessage;
      const sharedKey = this.deriveSharedKey(userId, senderId);
      return this.decryptMessage(encrypted, sharedKey);
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  }
}
