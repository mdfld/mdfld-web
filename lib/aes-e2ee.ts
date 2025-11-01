import "server-only";
import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from "crypto";

export interface EncryptedMessage {
  content: string;
  nonce: string;
  tag: string;
}

export class AES256E2EE {
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly SALT_LENGTH = 32; // 256 bits

  // Derive a shared key from two user IDs using scrypt
  static deriveSharedKey(userId1: string, userId2: string): Buffer {
    // Sort IDs to ensure same key regardless of order
    const combined = [userId1, userId2].sort().join(":");
    const secret = process.env.CHAT_ENCRYPTION_KEY || "default-chat-key";

    // Use scrypt for key derivation (more secure than simple SHA256)
    const salt = createHash("sha256")
      .update(combined)
      .digest()
      .subarray(0, this.SALT_LENGTH);

    return scryptSync(secret, salt, this.KEY_LENGTH);
  }

  // Encrypt a message using AES-256-GCM
  static encryptMessage(content: string, sharedKey: Buffer): EncryptedMessage {
    const nonce = randomBytes(this.IV_LENGTH);
    const cipher = createCipheriv(this.ALGORITHM, sharedKey, nonce);

    const encrypted = Buffer.concat([
      cipher.update(content, "utf8"),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return {
      content: encrypted.toString("base64"),
      nonce: nonce.toString("base64"),
      tag: tag.toString("base64"),
    };
  }

  // Decrypt a message using AES-256-GCM
  static decryptMessage(
    encrypted: EncryptedMessage,
    sharedKey: Buffer,
  ): string {
    // Validate encrypted message structure
    if (
      !encrypted ||
      !encrypted.nonce ||
      !encrypted.tag ||
      !encrypted.content
    ) {
      throw new Error("Invalid encrypted message structure");
    }

    const nonce = Buffer.from(encrypted.nonce, "base64");
    const tag = Buffer.from(encrypted.tag, "base64");
    const content = Buffer.from(encrypted.content, "base64");

    const decipher = createDecipheriv(this.ALGORITHM, sharedKey, nonce);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(content),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
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

      // Validate encrypted message structure
      if (!encrypted || typeof encrypted !== "object") {
        // Invalid encrypted message format
        return null;
      }

      const sharedKey = this.deriveSharedKey(userId, senderId);
      return this.decryptMessage(encrypted, sharedKey);
    } catch (error) {
      // Decryption error
      return null;
    }
  }
}
