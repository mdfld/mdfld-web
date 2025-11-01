import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { AES256E2EE } from "@/lib/aes-e2ee";
import {
  publishMessage,
  publishMessageStatus,
  publishTypingStatus,
  cacheMessage,
  setUserPresence,
  redis,
} from "@/lib/redis";

// Input validation schemas
const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(10000),
  type: z.enum(["TEXT", "IMAGE", "FILE"]).default("TEXT"),
  metadata: z.record(z.string(), z.any()).optional(),
});

const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1).max(10),
  type: z
    .enum(["DIRECT", "GROUP", "SUPPORT", "ORDER", "ORGANIZATION"])
    .default("DIRECT"),
  title: z.string().optional(),
  organizationId: z.string().optional(),
});

const searchUsersSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(20).default(10),
});

const markAsReadSchema = z.object({
  conversationId: z.string(),
  messageId: z.string(),
});

export const chatRouter = createTRPCRouter({
  // Get user's conversations
  conversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await ctx.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: ctx.user.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Get organization conversations if any
    const conversationIds = conversations.map((c) => c.id);
    const orgConversations = await ctx.prisma.orgConversation.findMany({
      where: {
        conversationId: { in: conversationIds },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            slug: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const orgConvMap = new Map(
      orgConversations.map((oc: any) => [oc.conversationId, oc]),
    );

    // Decrypt last messages for display and add org data
    const conversationsWithDecrypted = conversations.map((conversation) => {
      let result: any = { ...conversation };

      // Add organization data if exists
      const orgConv = orgConvMap.get(conversation.id);
      if (orgConv) {
        result.orgConversation = orgConv;
      }

      if (conversation.messages.length > 0) {
        const lastMessage = conversation.messages[0];
        const decryptedContent = AES256E2EE.decryptForUser(
          lastMessage.content,
          ctx.user.id,
          lastMessage.senderId,
        );

        result.messages = [
          {
            ...lastMessage,
            decryptedContent: decryptedContent || lastMessage.content,
          },
        ];
      }
      return result;
    });

    return conversationsWithDecrypted;
  }),

  // Get messages for a conversation
  messages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Handle empty conversationId
      if (!input.conversationId) {
        return {
          messages: [],
          nextCursor: undefined,
        };
      }

      // Verify user is participant
      const participant = await ctx.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this conversation",
        });
      }

      // Skip cache for now to ensure proper ordering
      // const cachedMessages = await getCachedMessages(input.conversationId);
      // if (cachedMessages.length > 0 && !input.cursor) {
      //   return {
      //     messages: cachedMessages,
      //     nextCursor: undefined,
      //   };
      // }

      // Fetch from database
      const messages = await ctx.prisma.message.findMany({
        where: {
          conversationId: input.conversationId,
          deletedAt: null,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
          receipts: {
            where: {
              userId: ctx.user.id,
            },
          },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      // Decrypt messages for the user
      const decryptedMessages = messages
        .slice(0, input.limit)
        .map((message) => {
          const decryptedContent = AES256E2EE.decryptForUser(
            message.content,
            ctx.user.id,
            message.senderId,
          );

          return {
            ...message,
            decryptedContent: decryptedContent || message.content,
          };
        });

      const hasMore = messages.length > input.limit;
      const nextCursor = hasMore ? messages[input.limit].id : undefined;

      return {
        messages: decryptedMessages.reverse(), // Reverse to show oldest first (newest at bottom)
        nextCursor,
      };
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user is participant
      const participant = await ctx.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant in this conversation",
        });
      }

      // Get all participants for encryption
      const participants = await ctx.prisma.conversationParticipant.findMany({
        where: { conversationId: input.conversationId },
        select: { userId: true },
      });

      // Encrypt the message for all participants
      const participantIds = participants.map((p) => p.userId);
      const encryptedVersions = AES256E2EE.encryptForConversation(
        input.content,
        ctx.user.id,
        participantIds,
      );

      // Store the message with encrypted content
      const message = await ctx.prisma.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          content: JSON.stringify(encryptedVersions), // Store all encrypted versions
          type: input.type,
          metadata: input.metadata,
          status: "SENT",
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
        },
      });

      // Update conversation's last message
      await ctx.prisma.conversation.update({
        where: { id: input.conversationId },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
        },
      });

      // Cache the message
      await cacheMessage(input.conversationId, {
        ...message,
        content: input.content, // Cache unencrypted for sender
      });

      // Publish to Redis for real-time updates
      await publishMessage(input.conversationId, {
        ...message,
        content: input.content, // Send unencrypted to Redis, clients will decrypt
      });

      // Update unread counts for other participants
      await ctx.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId: { not: ctx.user.id },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });

      // Create notifications for all other participants
      const otherParticipants = participants.filter(
        (p) => p.userId !== ctx.user.id,
      );

      // Create notifications for each recipient
      const notifications = await Promise.all(
        otherParticipants.map((participant) =>
          ctx.prisma.notification.create({
            data: {
              userId: participant.userId,
              type: "NEW_MESSAGE",
              title: `New message from ${ctx.user.name}`,
              content:
                input.type === "TEXT"
                  ? input.content.length > 50
                    ? input.content.substring(0, 50) + "..."
                    : input.content
                  : `Sent you ${input.type === "IMAGE" ? "an image" : "a file"}`,
              metadata: {
                conversationId: input.conversationId,
                messageId: message.id,
                senderId: ctx.user.id,
                senderName: ctx.user.name,
                senderImage: ctx.user.image,
                messageType: input.type,
              },
            },
          }),
        ),
      );

      // Publish notification update to Redis for real-time updates
      for (let i = 0; i < otherParticipants.length; i++) {
        const participant = otherParticipants[i];
        const notification = notifications[i];
        await publishMessage(`notifications:${participant.userId}`, {
          type: "NEW_NOTIFICATION",
          notification: {
            ...notification,
            metadata: notification.metadata as any,
          },
        });
      }

      // Return the message with decrypted content for the sender
      return {
        ...message,
        decryptedContent: input.content,
      };
    }),

  // Create a new conversation
  createConversation: protectedProcedure
    .input(createConversationSchema)
    .mutation(async ({ ctx, input }) => {
      // Ensure user is included in participants
      const allParticipantIds = [
        ...new Set([ctx.user.id, ...input.participantIds]),
      ];

      // For direct messages, ensure only 2 participants
      if (input.type === "DIRECT" && allParticipantIds.length !== 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Direct conversations must have exactly 2 participants",
        });
      }

      // Check if direct conversation already exists
      if (input.type === "DIRECT") {
        const existingConversation = await ctx.prisma.conversation.findFirst({
          where: {
            type: "DIRECT",
            participants: {
              every: {
                userId: { in: allParticipantIds },
              },
            },
          },
        });

        if (existingConversation) {
          return existingConversation;
        }
      }

      // Create the conversation
      const conversation = await ctx.prisma.conversation.create({
        data: {
          type: input.type,
          title: input.title,
          participants: {
            create: allParticipantIds.map((userId) => ({
              userId,
              role: userId === ctx.user.id ? "admin" : "member",
            })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  username: true,
                },
              },
            },
          },
        },
      });

      return conversation;
    }),

  // Mark messages as read
  markAsRead: protectedProcedure
    .input(markAsReadSchema)
    .mutation(async ({ ctx, input }) => {
      // Update last read timestamp
      await ctx.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId: ctx.user.id,
          },
        },
        data: {
          lastReadAt: new Date(),
          lastReadMessageId: input.messageId,
          unreadCount: 0,
        },
      });

      // Create read receipt
      await ctx.prisma.messageReceipt.upsert({
        where: {
          messageId_userId: {
            messageId: input.messageId,
            userId: ctx.user.id,
          },
        },
        create: {
          messageId: input.messageId,
          userId: ctx.user.id,
          status: "READ",
          readAt: new Date(),
        },
        update: {
          status: "READ",
          readAt: new Date(),
        },
      });

      // Publish read status
      await publishMessageStatus(input.conversationId, input.messageId, "READ");

      return { success: true };
    }),

  // Send typing indicator
  sendTyping: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        isTyping: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await publishTypingStatus(
        input.conversationId,
        ctx.user.id,
        input.isTyping,
      );
      return { success: true };
    }),

  // Update user presence
  updatePresence: protectedProcedure
    .input(
      z.object({
        status: z.enum(["online", "offline"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await setUserPresence(ctx.user.id, input.status);
      return { success: true };
    }),

  // Search users
  searchUsers: protectedProcedure
    .input(searchUsersSchema)
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: input.query, mode: "insensitive" } },
                { username: { contains: input.query, mode: "insensitive" } },
                { email: { contains: input.query, mode: "insensitive" } },
              ],
            },
            { id: { not: ctx.user.id } }, // Exclude current user
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        take: input.limit,
      });

      return users;
    }),

  // Delete a message
  deleteMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First, get the message to verify ownership
      const message = await ctx.prisma.message.findUnique({
        where: { id: input.messageId },
        select: {
          id: true,
          senderId: true,
          conversationId: true,
        },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Only the sender can delete their own message
      if (message.senderId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own messages",
        });
      }

      // Soft delete the message by updating its content
      const deletedMessage = await ctx.prisma.message.update({
        where: { id: input.messageId },
        data: {
          content: "This message has been deleted",
          deletedAt: new Date(),
          metadata: {
            deleted: true,
            deletedBy: ctx.user.id,
            originalDeletedAt: new Date().toISOString(),
          },
        },
      });

      // Publish the delete event for real-time updates
      await publishMessage(message.conversationId, {
        ...deletedMessage,
        type: "MESSAGE_DELETED",
      });

      // Update cache if it exists
      const cacheKey = `messages:${message.conversationId}`;
      const cachedMessages = await redis?.lrange(cacheKey, 0, -1);
      if (cachedMessages && cachedMessages.length > 0) {
        // Clear the list
        await redis?.del(cacheKey);

        // Re-add updated messages
        for (const msg of cachedMessages.reverse()) {
          const parsedMsg = JSON.parse(msg);
          const updatedMsg =
            parsedMsg.id === input.messageId
              ? {
                  ...parsedMsg,
                  content: "This message has been deleted",
                  deletedAt: new Date(),
                }
              : parsedMsg;
          await redis?.lpush(cacheKey, JSON.stringify(updatedMsg));
        }

        // Set expiry
        await redis?.expire(cacheKey, 300);
      }

      return { success: true };
    }),
});
