#!/usr/bin/env node

// Migration script to re-encrypt messages from XOR to AES-256
// Run with: node scripts/migrate-encryption.js

import { PrismaClient } from "@prisma/client";
import { SimpleE2EE } from "../lib/simple-e2ee.js";
import { AES256E2EE } from "../lib/aes-e2ee.js";

const prisma = new PrismaClient();

async function migrateMessages() {
  console.log("Starting encryption migration...");

  try {
    // Get all messages
    const messages = await prisma.message.findMany({
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    console.log(`Found ${messages.length} messages to migrate`);

    let migrated = 0;
    let failed = 0;

    for (const message of messages) {
      try {
        // Skip if already using new format (has 'tag' field)
        const content = JSON.parse(message.content);
        if (content[Object.keys(content)[0]]?.includes('"tag"')) {
          console.log(`Message ${message.id} already migrated, skipping...`);
          continue;
        }

        // Get participant IDs
        const participantIds = message.conversation.participants.map(
          (p) => p.userId,
        );

        // Try to decrypt with old method
        let decryptedContent = null;
        for (const participantId of participantIds) {
          decryptedContent = SimpleE2EE.decryptForUser(
            message.content,
            participantId,
            message.senderId,
          );
          if (decryptedContent) break;
        }

        if (!decryptedContent) {
          console.log(`Failed to decrypt message ${message.id}`);
          failed++;
          continue;
        }

        // Re-encrypt with new method
        const newEncryptedVersions = AES256E2EE.encryptForConversation(
          decryptedContent,
          message.senderId,
          participantIds,
        );

        // Update the message
        await prisma.message.update({
          where: { id: message.id },
          data: {
            content: JSON.stringify(newEncryptedVersions),
          },
        });

        migrated++;
        if (migrated % 100 === 0) {
          console.log(`Migrated ${migrated} messages...`);
        }
      } catch (error) {
        console.error(`Error migrating message ${message.id}:`, error);
        failed++;
      }
    }

    console.log(`
Migration complete!
- Total messages: ${messages.length}
- Successfully migrated: ${migrated}
- Failed: ${failed}
`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateMessages().catch(console.error);
