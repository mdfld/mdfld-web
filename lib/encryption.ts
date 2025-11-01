import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scrypt,
  CipherGCMTypes,
} from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Encryption key - In production, this should be stored securely and rotated regularly
const ENCRYPTION_KEY =
  process.env.CHAT_ENCRYPTION_KEY || "default-32-byte-encryption-key!!";

export class MessageEncryption {
  private static algorithm: CipherGCMTypes = "aes-256-gcm";

  static async encrypt(
    text: string,
  ): Promise<{ encrypted: string; iv: string; authTag: string }> {
    const iv = randomBytes(16);
    const key = await this.deriveKey(ENCRYPTION_KEY);

    const cipher = createCipheriv(this.algorithm, key as any, iv as any);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
    };
  }

  static async decrypt(
    encrypted: string,
    iv: string,
    authTag: string,
  ): Promise<string> {
    const key = await this.deriveKey(ENCRYPTION_KEY);

    const decipher = createDecipheriv(
      this.algorithm,
      key as any,
      Buffer.from(iv, "hex") as any,
    );

    decipher.setAuthTag(Buffer.from(authTag, "hex") as any);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  private static async deriveKey(password: string): Promise<Buffer> {
    const salt = "salt-for-key-derivation"; // In production, use a proper salt
    return (await scryptAsync(password, salt, 32)) as Buffer;
  }
}

// Helper functions for message encryption
export async function encryptMessage(content: string): Promise<string> {
  const { encrypted, iv, authTag } = await MessageEncryption.encrypt(content);
  // Store as JSON string with all components
  return JSON.stringify({ encrypted, iv, authTag });
}

export async function decryptMessage(encryptedData: string): Promise<string> {
  try {
    const { encrypted, iv, authTag } = JSON.parse(encryptedData);
    return await MessageEncryption.decrypt(encrypted, iv, authTag);
  } catch (error) {
    // Failed to decrypt message
    return "[Encrypted message]";
  }
}
