import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const organizationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        website: z.string().url().optional(),
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

      // Check if slug is already taken
      const existing = await prisma.organization.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organization slug already exists",
        });
      }

      // Create organization with the user as owner
      const organization = await prisma.organization.create({
        data: {
          name: input.name,
          slug: input.slug,
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
            where: { userId },
            select: { role: true },
          },
        },
      });

      if (!organization || organization.members.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      return {
        ...organization,
        role: organization.members[0].role,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        website: z.string().url().optional(),
        industry: z.string().optional(),
        size: z
          .enum(["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"])
          .optional(),
        businessType: z
          .enum(["INDIVIDUAL", "SMALL_BUSINESS", "CORPORATION", "NON_PROFIT"])
          .optional(),
        taxId: z.string().optional(),
        businessLicense: z.string().optional(),
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
});
