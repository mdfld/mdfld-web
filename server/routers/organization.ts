import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { AES256E2EE } from "@/lib/aes-e2ee";
import { publishMessage, cacheMessage } from "@/lib/redis";

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        website: z.string().optional(),
        industry: z.string().optional(),
        size: z
          .enum(["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"])
          .optional(),
        businessType: z
          .enum(["INDIVIDUAL", "SMALL_BUSINESS", "CORPORATION", "NON_PROFIT"])
          .optional(),
        taxId: z.string().optional(),
        businessLicense: z.string().optional(),
        address: z
          .object({
            street: z.string(),
            city: z.string(),
            state: z.string(),
            postalCode: z.string(),
            country: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if slug is already taken and generate a unique one if needed
      let finalSlug = input.slug;
      let slugExists = true;
      let counter = 0;

      while (slugExists) {
        const existing = await prisma.organization.findUnique({
          where: { slug: finalSlug },
        });

        if (!existing) {
          slugExists = false;
        } else {
          counter++;
          // Add a number suffix to make it unique
          finalSlug = `${input.slug}-${counter}`;
        }
      }

      // Create organization with the user as owner
      const organization = await prisma.organization.create({
        data: {
          name: input.name,
          slug: finalSlug,
          description: input.description,
          website: input.website,
          industry: input.industry,
          size: input.size,
          businessType: input.businessType || "INDIVIDUAL",
          taxId: input.taxId,
          businessLicense: input.businessLicense,
          members: {
            create: {
              userId,
              role: "owner",
            },
          },
        },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      // Create seller profile automatically for the organization
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      await prisma.sellerProfile.create({
        data: {
          organizationId: organization.id,
          storeName: input.name,
          storeDescription:
            input.description || `Official store for ${input.name}`,
          businessEmail: user?.email || "",
          shippingPolicy:
            "Standard shipping rates apply. Orders are processed within 1-2 business days.",
          returnPolicy:
            "30-day return policy for unused items in original condition.",
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId: organization.id,
          action: "organization.created",
          entityType: "organization",
          entityId: organization.id,
          newValues: organization as any,
        },
      });

      return organization;
    }),

  getMyOrganizations: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const organizations = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return organizations.map((member) => ({
      ...member.organization,
      role: member.role,
    }));
  }),

  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const organization = await prisma.organization.findUnique({
        where: { slug: input.slug },
        include: {
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Find current user's role
      const currentUserMember = organization.members.find(
        (m) => m.userId === userId,
      );
      if (!currentUserMember) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      return {
        ...organization,
        role: currentUserMember.role,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        website: z.string().optional(),
        logo: z.string().optional(),
        banner: z.string().optional(),
        industry: z.string().optional(),
        size: z
          .enum(["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"])
          .optional(),
        businessType: z
          .enum(["INDIVIDUAL", "SMALL_BUSINESS", "CORPORATION", "NON_PROFIT"])
          .optional(),
        taxId: z.string().optional(),
        businessLicense: z.string().optional(),
        addressStreet: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z.string().optional(),
        addressZip: z.string().optional(),
        addressCountry: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { organizationId, ...updateData } = input;

      // Check if user has permission
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
      });

      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this organization",
        });
      }

      const oldOrganization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      const organization = await prisma.organization.update({
        where: { id: organizationId },
        data: updateData,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId,
          action: "organization.updated",
          entityType: "organization",
          entityId: organizationId,
          oldValues: oldOrganization as any,
          newValues: organization as any,
        },
      });

      return organization;
    }),

  checkSlugAvailability: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const existing = await prisma.organization.findUnique({
        where: { slug: input.slug },
      });

      return { available: !existing };
    }),

  getProducts: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        category: z.string().optional(),
        status: z.enum(["all", "active", "draft", "archived"]).default("all"),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user is a member
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      const where: any = {
        organizationId: input.organizationId,
      };

      if (input.status !== "all") {
        where.isActive = input.status === "active";
      }

      if (input.category) {
        where.category = input.category;
      }

      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          { brand: { contains: input.search, mode: "insensitive" } },
          { sku: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const items = await prisma.product.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          seller: {
            select: {
              id: true,
              storeName: true,
            },
          },
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  getOrders: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user is a member
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      const where: any = {
        organizationId: input.organizationId,
      };

      if (input.status && input.status !== "all") {
        where.status = input.status.toUpperCase();
      }

      if (input.search) {
        where.OR = [
          { orderNumber: { contains: input.search, mode: "insensitive" } },
          {
            buyerProfile: {
              user: { name: { contains: input.search, mode: "insensitive" } },
            },
          },
          {
            buyerProfile: {
              user: { email: { contains: input.search, mode: "insensitive" } },
            },
          },
        ];
      }

      const items = await prisma.order.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          buyer: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
          items: {
            include: {
              product: {
                select: {
                  title: true,
                  images: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: typeof input.cursor = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  inviteMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        email: z.string().email(),
        role: z.enum(["owner", "admin", "member"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user has permission
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId,
          },
        },
      });

      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to invite members",
        });
      }

      // Find user by email
      const invitedUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!invitedUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found with this email",
        });
      }

      // Check if already a member
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: invitedUser.id,
          },
        },
      });

      if (existingMember) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member",
        });
      }

      // Add member
      const newMember = await prisma.organizationMember.create({
        data: {
          organizationId: input.organizationId,
          userId: invitedUser.id,
          role: input.role,
        },
        include: {
          user: true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId: input.organizationId,
          action: "member.invited",
          entityType: "organizationMember",
          entityId: newMember.id,
          newValues: newMember as any,
        },
      });

      return newMember;
    }),

  updateMemberRole: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        memberId: z.string(),
        role: z.enum(["owner", "admin", "member"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user has permission
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId,
          },
        },
      });

      if (!member || member.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can change member roles",
        });
      }

      // Can't change your own role
      if (member.id === input.memberId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't change your own role",
        });
      }

      const updatedMember = await prisma.organizationMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
        include: {
          user: true,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId: input.organizationId,
          action: "member.role_updated",
          entityType: "organizationMember",
          entityId: updatedMember.id,
          newValues: { role: input.role },
        },
      });

      return updatedMember;
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        memberId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user has permission
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId,
          },
        },
      });

      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove members",
        });
      }

      // Can't remove yourself
      if (member.id === input.memberId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't remove yourself",
        });
      }

      // Can't remove owners if you're not an owner
      const targetMember = await prisma.organizationMember.findUnique({
        where: { id: input.memberId },
      });

      if (targetMember?.role === "owner" && member.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only owners can remove other owners",
        });
      }

      await prisma.organizationMember.delete({
        where: { id: input.memberId },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId: input.organizationId,
          action: "member.removed",
          entityType: "organizationMember",
          entityId: input.memberId,
        },
      });

      return { success: true };
    }),

  // Get organization's conversations
  getConversations: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First verify user has access to this organization
      const member = await ctx.prisma.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Get all organization conversations
      const orgConversations = await ctx.prisma.orgConversation.findMany({
        where: {
          organizationId: input.organizationId,
        },
        include: {
          conversation: {
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
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      // Decrypt last messages and format response
      const conversationsWithDecrypted = orgConversations.map(
        (orgConv: any) => {
          const conversation = orgConv.conversation;
          let result: any = {
            id: conversation.id,
            type: conversation.type,
            title: conversation.title,
            lastMessageAt: conversation.lastMessageAt,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            participants: conversation.participants,
            orgConversation: {
              id: orgConv.id,
              organizationId: orgConv.organizationId,
              handledBy: orgConv.handledBy,
              category: orgConv.category,
              priority: orgConv.priority,
              status: orgConv.status,
              notes: orgConv.notes,
            },
            messages: [],
          };

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
        },
      );

      return conversationsWithDecrypted;
    }),

  // Update organization conversation metadata
  updateConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        organizationId: z.string(),
        updates: z.object({
          handledBy: z.string().optional(),
          category: z.string().optional(),
          priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
          status: z
            .enum([
              "OPEN",
              "IN_PROGRESS",
              "WAITING_ON_USER",
              "WAITING_ON_ORG",
              "RESOLVED",
              "CLOSED",
            ])
            .optional(),
          notes: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Update org conversation
      const updated = await prisma.orgConversation.update({
        where: {
          conversationId: input.conversationId,
        },
        data: input.updates,
      });

      return updated;
    }),

  // Create organization conversation
  createOrganizationConversation: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        participantIds: z.array(z.string()).min(1),
        title: z.string().optional(),
        category: z.string().optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has access
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Get organization members who can participate
      const orgMembers = await prisma.organizationMember.findMany({
        where: {
          organizationId: input.organizationId,
        },
        select: {
          userId: true,
        },
      });

      const orgMemberIds = orgMembers.map((m) => m.userId);

      // Create conversation with organization type
      const conversation = await prisma.conversation.create({
        data: {
          type: "ORGANIZATION",
          title: input.title,
          participants: {
            create: [
              // Add all organization members
              ...orgMemberIds.map((userId) => ({
                userId,
                role: "member",
              })),
              // Add the external participants
              ...input.participantIds
                .filter((id) => !orgMemberIds.includes(id))
                .map((userId) => ({
                  userId,
                  role: "member",
                })),
            ],
          },
        },
      });

      // Create org conversation metadata
      await prisma.orgConversation.create({
        data: {
          organizationId: input.organizationId,
          conversationId: conversation.id,
          handledBy: ctx.user.id,
          category: input.category,
          priority: input.priority,
          status: "OPEN",
        },
      });

      return conversation;
    }),

  // Send message as organization
  sendMessageAsOrganization: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        organizationId: z.string(),
        content: z.string().min(1).max(10000),
        type: z.enum(["TEXT", "IMAGE", "FILE"]).default("TEXT"),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is organization member
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Verify conversation belongs to organization
      const orgConv = await prisma.orgConversation.findUnique({
        where: {
          conversationId: input.conversationId,
        },
      });

      if (!orgConv || orgConv.organizationId !== input.organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This conversation does not belong to your organization",
        });
      }

      // Get all participants for encryption
      const participants = await prisma.conversationParticipant.findMany({
        where: { conversationId: input.conversationId },
        select: { userId: true },
      });

      // Encrypt the message for all participants
      const participantIds = participants.map((p: any) => p.userId);
      const encryptedVersions = AES256E2EE.encryptForConversation(
        input.content,
        ctx.user.id,
        participantIds,
      );

      // Store the message
      const message = await prisma.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          content: JSON.stringify(encryptedVersions),
          type: input.type,
          metadata: {
            ...input.metadata,
            sentAsOrganization: true,
            organizationId: input.organizationId,
          },
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
      await prisma.conversation.update({
        where: { id: input.conversationId },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
        },
      });

      // Update org conversation activity
      await prisma.orgConversation.update({
        where: { conversationId: input.conversationId },
        data: {
          handledBy: ctx.user.id,
          updatedAt: new Date(),
        },
      });

      // Cache and publish message
      await cacheMessage(input.conversationId, {
        ...message,
        content: input.content,
      });

      await publishMessage(input.conversationId, {
        ...message,
        content: input.content,
      });

      // Update unread counts
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: input.conversationId,
          userId: { not: ctx.user.id },
        },
        data: {
          unreadCount: { increment: 1 },
        },
      });

      return {
        ...message,
        decryptedContent: input.content,
      };
    }),

  // Search users and organizations for new conversations
  searchUsersAndOrganizations: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        organizationId: z.string(),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: ctx.user.id,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Search users
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { username: { contains: input.query, mode: "insensitive" } },
            { email: { contains: input.query, mode: "insensitive" } },
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

      // Search organizations (excluding current one)
      const organizations = await prisma.organization.findMany({
        where: {
          AND: [
            { id: { not: input.organizationId } },
            {
              OR: [
                { name: { contains: input.query, mode: "insensitive" } },
                { slug: { contains: input.query, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
        take: Math.floor(input.limit / 2),
      });

      return {
        users,
        organizations,
      };
    }),

  getSellerProfile: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user is a member
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId,
          },
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { organizationId: input.organizationId },
      });

      return sellerProfile;
    }),

  createSellerProfile: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        storeName: z.string().min(1).max(100),
        storeDescription: z.string().optional(),
        businessEmail: z.string().email(),
        businessPhone: z.string().optional(),
        shippingPolicy: z.string().optional(),
        returnPolicy: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user is a member with proper role
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId,
          },
        },
      });

      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be an owner or admin to create a seller profile",
        });
      }

      // Check if seller profile already exists
      const existing = await prisma.sellerProfile.findUnique({
        where: { organizationId: input.organizationId },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This organization already has a seller profile",
        });
      }

      // Get organization details
      const organization = await prisma.organization.findUnique({
        where: { id: input.organizationId },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Create seller profile
      const sellerProfile = await prisma.sellerProfile.create({
        data: {
          organizationId: input.organizationId,
          storeName: input.storeName,
          storeDescription: input.storeDescription,
          businessEmail: input.businessEmail,
          businessPhone: input.businessPhone,
          shippingPolicy: input.shippingPolicy,
          returnPolicy: input.returnPolicy,
          taxNumber: organization.taxId,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId: input.organizationId,
          action: "seller_profile.created",
          entityType: "seller_profile",
          entityId: sellerProfile.id,
          newValues: sellerProfile as any,
        },
      });

      return sellerProfile;
    }),

  updateSellerProfile: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        storeName: z.string().min(1).max(100).optional(),
        storeDescription: z.string().optional(),
        businessEmail: z.string().email().optional(),
        businessPhone: z.string().optional(),
        shippingPolicy: z.string().optional(),
        returnPolicy: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user is a member with proper role
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId,
          },
        },
      });

      if (!member || (member.role !== "owner" && member.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be an owner or admin to update the seller profile",
        });
      }

      // Get existing profile
      const existing = await prisma.sellerProfile.findUnique({
        where: { organizationId: input.organizationId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller profile not found",
        });
      }

      // Update seller profile
      const { organizationId, ...updateData } = input;
      const sellerProfile = await prisma.sellerProfile.update({
        where: { organizationId: input.organizationId },
        data: updateData,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          organizationId: input.organizationId,
          action: "seller_profile.updated",
          entityType: "seller_profile",
          entityId: sellerProfile.id,
          oldValues: existing as any,
          newValues: sellerProfile as any,
        },
      });

      return sellerProfile;
    }),

  // Delete organization
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Check if user is the owner
      const member = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: input.id,
            userId,
          },
        },
      });

      if (!member || member.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can delete the organization",
        });
      }

      // Get organization for audit log
      const organization = await prisma.organization.findUnique({
        where: { id: input.id },
        include: {
          members: true,
          invitations: true,
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Delete in transaction
      await prisma.$transaction(async (tx) => {
        // Delete all organization-related data in order

        // Delete audit logs
        await tx.auditLog.deleteMany({
          where: { organizationId: input.id },
        });

        // Delete invitations
        await tx.organizationInvitation.deleteMany({
          where: { organizationId: input.id },
        });

        // Delete seller profile
        await tx.sellerProfile.deleteMany({
          where: { organizationId: input.id },
        });

        // Delete products and related data
        const products = await tx.product.findMany({
          where: { organizationId: input.id },
          select: { id: true },
        });

        const productIds = products.map((p) => p.id);

        if (productIds.length > 0) {
          // Note: productImage table might not exist, skip if error

          // Delete product variants
          await tx.productVariant.deleteMany({
            where: { productId: { in: productIds } },
          });

          // Delete products
          await tx.product.deleteMany({
            where: { id: { in: productIds } },
          });
        }

        // Delete organization members
        await tx.organizationMember.deleteMany({
          where: { organizationId: input.id },
        });

        // Delete the organization
        await tx.organization.delete({
          where: { id: input.id },
        });

        // Create a final audit log in the user's context
        await tx.auditLog.create({
          data: {
            userId,
            organizationId: null, // Organization is deleted
            action: "organization.deleted",
            entityType: "organization",
            entityId: input.id,
            oldValues: organization as any,
            newValues: {} as any,
          },
        });
      });

      return { success: true };
    }),
});
