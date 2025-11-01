import { z } from "zod";
import { protectedProcedure, publicProcedure, createTRPCRouter } from "../trpc";
import { stripe, formatAmountForStripe } from "@/lib/stripe";
import { TRPCError } from "@trpc/server";
import {
  VariantType,
  SizeSystem,
  ProductCondition,
  ProductTier,
  SoleplateType,
  PlayerVersion,
} from "@prisma/client";

import { PRODUCT_CATEGORIES } from "@/lib/constants/product-categories";

const productVariantSchema = z.object({
  sizeValue: z.string(),
  sizeSystem: z.nativeEnum(SizeSystem),
  sizeDisplay: z.string(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  inventory: z.number().int().nonnegative(),
  images: z.array(z.string().url()),
});

const createProductSchema = z.object({
  sellerProfileId: z.string(),
  organizationId: z.string().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  category: z.enum(Object.keys(PRODUCT_CATEGORIES) as [string, ...string[]]),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional().nullable(),
  inventory: z.number().int().nonnegative(),
  weight: z.number().positive().optional(),
  dimensions: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  images: z.array(z.string().url()),
  tags: z.array(z.string()),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),

  // New fields for variants
  hasVariants: z.boolean().default(false),
  variantType: z.nativeEnum(VariantType).optional(),
  condition: z.nativeEnum(ProductCondition).default(ProductCondition.BRAND_NEW),

  // Conditional fields
  tier: z.nativeEnum(ProductTier).optional(),
  year: z.number().optional(),
  season: z.string().optional(),
  material: z.string().optional(),
  soleplateType: z.nativeEnum(SoleplateType).optional(),
  playerVersion: z.nativeEnum(PlayerVersion).optional(),

  // Variants array
  variants: z.array(productVariantSchema).optional(),
});

export { PRODUCT_CATEGORIES };

export const productRouter = createTRPCRouter({
  // Create a new product
  create: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify seller profile ownership
      const sellerProfile = await ctx.prisma.sellerProfile.findUnique({
        where: { id: input.sellerProfileId },
      });

      if (!sellerProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller profile not found",
        });
      }

      // Check ownership
      if (
        sellerProfile.userId !== userId &&
        (!input.organizationId ||
          sellerProfile.organizationId !== input.organizationId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to create products for this seller",
        });
      }

      // Create Stripe product if seller has Stripe account
      let stripeProductId: string | undefined;
      let stripePriceId: string | undefined;

      if (sellerProfile.stripeAccountId && sellerProfile.stripeChargesEnabled) {
        try {
          // Create product in Stripe
          const stripeProduct = await stripe.products.create({
            name: input.title,
            description: input.description || undefined,
            images: input.images.slice(0, 8), // Stripe allows max 8 images
            metadata: {
              sellerProfileId: input.sellerProfileId,
              organizationId: input.organizationId || "",
            },
          });

          stripeProductId = stripeProduct.id;

          // Create price in Stripe
          const stripePrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: formatAmountForStripe(input.price),
            currency: "usd",
          });

          stripePriceId = stripePrice.id;
        } catch (error) {
          // Error creating Stripe product
          // Continue without Stripe - can be added later
        }
      }

      // Create product in database
      const product = await ctx.prisma.product.create({
        data: {
          sellerProfileId: input.sellerProfileId,
          organizationId: input.organizationId,
          title: input.title,
          description: input.description,
          price: input.price,
          compareAtPrice: input.compareAtPrice,
          category: input.category as any,
          subcategory: input.subcategory as any,
          brand: input.brand,
          sku: input.sku || undefined,
          inventory: input.inventory,
          weight: input.weight,
          dimensions: input.dimensions,
          images: input.images,
          tags: input.tags,
          isActive: input.isActive,
          featured: input.featured,
          hasVariants: input.hasVariants,
          variantType: input.variantType,
          condition: input.condition,
          tier: input.tier,
          year: input.year,
          season: input.season,
          material: input.material,
          soleplateType: input.soleplateType,
          playerVersion: input.playerVersion,
          stripeProductId,
          stripePriceId,
          // Create variants if provided
          variants:
            input.variants && input.hasVariants
              ? {
                  create: await Promise.all(
                    input.variants.map(async (variant) => {
                      // Create Stripe price for each variant if seller has Stripe
                      let variantStripePriceId: string | undefined;

                      if (
                        sellerProfile.stripeAccountId &&
                        sellerProfile.stripeChargesEnabled &&
                        stripeProductId
                      ) {
                        try {
                          const stripePrice = await stripe.prices.create({
                            product: stripeProductId,
                            unit_amount: formatAmountForStripe(variant.price),
                            currency: "usd",
                            metadata: {
                              size: variant.sizeValue,
                              color: variant.color || "",
                            },
                          });
                          variantStripePriceId = stripePrice.id;
                        } catch (error) {
                          // Error creating Stripe price for variant
                        }
                      }

                      return {
                        ...variant,
                        stripePriceId: variantStripePriceId,
                      };
                    }),
                  ),
                }
              : undefined,
        },
        include: {
          variants: true,
        },
      });

      return product;
    }),

  // Update a product
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: createProductSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get existing product with seller profile
      const existingProduct = await ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: {
          seller: true,
        },
      });

      if (!existingProduct) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check ownership
      if (
        existingProduct.seller.userId !== userId &&
        (!existingProduct.organizationId ||
          existingProduct.seller.organizationId !==
            existingProduct.organizationId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to update this product",
        });
      }

      // Update Stripe product if exists and price changed
      if (
        existingProduct.stripeProductId &&
        input.data.price &&
        existingProduct.price.toNumber() !== input.data.price
      ) {
        try {
          // Create new price (Stripe prices are immutable)
          const stripePrice = await stripe.prices.create({
            product: existingProduct.stripeProductId,
            unit_amount: formatAmountForStripe(input.data.price),
            currency: "usd",
          });

          (input.data as any).stripePriceId = stripePrice.id;

          // Archive old price
          if (existingProduct.stripePriceId) {
            await stripe.prices.update(existingProduct.stripePriceId, {
              active: false,
            });
          }
        } catch (error) {
          // Error updating Stripe price
        }
      }

      // Update product in database
      const product = await ctx.prisma.product.update({
        where: { id: input.id },
        data: input.data as any,
      });

      return product;
    }),

  // Delete a product
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get product with seller profile
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: { seller: true },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check ownership
      if (
        product.seller.userId !== userId &&
        (!product.organizationId ||
          product.seller.organizationId !== product.organizationId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this product",
        });
      }

      // Archive Stripe product if exists
      if (product.stripeProductId) {
        try {
          await stripe.products.update(product.stripeProductId, {
            active: false,
          });
        } catch (error) {
          // Error archiving Stripe product
        }
      }

      // Soft delete - just mark as inactive
      await ctx.prisma.product.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return { success: true };
    }),

  // Get products by seller
  getBySeller: publicProcedure
    .input(
      z.object({
        sellerProfileId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.product.findMany({
        where: {
          sellerProfileId: input.sellerProfileId,
          isActive: input.isActive ?? true,
          category: input.category as any,
        },
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
              averageRating: true,
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

  // Get single product
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({
        where: {
          id: input.id,
          isActive: true,
        },
        include: {
          seller: {
            select: {
              id: true,
              storeName: true,
              storeDescription: true,
              averageRating: true,
              totalSales: true,
              shippingPolicy: true,
              returnPolicy: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logo: true,
                },
              },
            },
          },
          variants: {
            where: {
              isActive: true,
            },
            orderBy: [{ sizeValue: "asc" }, { color: "asc" }],
          },
          sizeChart: true,
          reviews: {
            take: 5,
            orderBy: {
              createdAt: "desc",
            },
            include: {
              buyer: {
                select: {
                  user: {
                    select: {
                      name: true,
                      image: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product;
    }),

  // Search products
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        isActive: true,
      };

      if (input.query) {
        where.OR = [
          { title: { contains: input.query, mode: "insensitive" } },
          { description: { contains: input.query, mode: "insensitive" } },
          { brand: { contains: input.query, mode: "insensitive" } },
        ];
      }

      if (input.category) {
        where.category = input.category as any;
      }

      if (input.minPrice !== undefined || input.maxPrice !== undefined) {
        where.price = {};
        if (input.minPrice !== undefined) {
          where.price.gte = input.minPrice;
        }
        if (input.maxPrice !== undefined) {
          where.price.lte = input.maxPrice;
        }
      }

      if (input.tags && input.tags.length > 0) {
        where.tags = {
          hasSome: input.tags,
        };
      }

      const items = await ctx.prisma.product.findMany({
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
              averageRating: true,
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

  // Get categories
  getCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ["category"],
    });

    return categories.map((c) => c.category);
  }),

  // Create product variant
  createVariant: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        variant: productVariantSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get product with seller
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        include: { seller: true },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Check ownership
      if (
        product.seller.userId !== userId &&
        (!product.organizationId ||
          product.seller.organizationId !== product.organizationId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to modify this product",
        });
      }

      // Create Stripe price if needed
      let stripePriceId: string | undefined;
      if (product.stripeProductId && product.seller.stripeChargesEnabled) {
        try {
          const stripePrice = await stripe.prices.create({
            product: product.stripeProductId,
            unit_amount: formatAmountForStripe(input.variant.price),
            currency: "usd",
            metadata: {
              size: input.variant.sizeValue,
              color: input.variant.color || "",
            },
          });
          stripePriceId = stripePrice.id;
        } catch (error) {
          // Error creating Stripe price for variant
        }
      }

      // Create variant
      const variant = await ctx.prisma.productVariant.create({
        data: {
          ...input.variant,
          productId: input.productId,
          stripePriceId,
        },
      });

      // Update product to indicate it has variants
      if (!product.hasVariants) {
        await ctx.prisma.product.update({
          where: { id: input.productId },
          data: { hasVariants: true },
        });
      }

      return variant;
    }),

  // Update product variant
  updateVariant: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: productVariantSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get variant with product and seller
      const variant = await ctx.prisma.productVariant.findUnique({
        where: { id: input.id },
        include: {
          product: {
            include: { seller: true },
          },
        },
      });

      if (!variant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Variant not found",
        });
      }

      // Check ownership
      if (
        variant.product.seller.userId !== userId &&
        (!variant.product.organizationId ||
          variant.product.seller.organizationId !==
            variant.product.organizationId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to modify this variant",
        });
      }

      // Update Stripe price if price changed
      if (
        input.data.price &&
        variant.stripePriceId &&
        variant.price.toNumber() !== input.data.price
      ) {
        try {
          const stripePrice = await stripe.prices.create({
            product: variant.product.stripeProductId!,
            unit_amount: formatAmountForStripe(input.data.price),
            currency: "usd",
            metadata: {
              size: input.data.sizeValue || variant.sizeValue,
              color: input.data.color || variant.color || "",
            },
          });
          (input.data as any).stripePriceId = stripePrice.id;

          // Archive old price
          await stripe.prices.update(variant.stripePriceId, {
            active: false,
          });
        } catch (error) {
          // Error updating Stripe price
        }
      }

      // Update variant
      const updatedVariant = await ctx.prisma.productVariant.update({
        where: { id: input.id },
        data: input.data,
      });

      return updatedVariant;
    }),

  // Delete variant
  deleteVariant: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get variant with product and seller
      const variant = await ctx.prisma.productVariant.findUnique({
        where: { id: input.id },
        include: {
          product: {
            include: { seller: true },
          },
        },
      });

      if (!variant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Variant not found",
        });
      }

      // Check ownership
      if (
        variant.product.seller.userId !== userId &&
        (!variant.product.organizationId ||
          variant.product.seller.organizationId !==
            variant.product.organizationId)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to delete this variant",
        });
      }

      // Archive Stripe price if exists
      if (variant.stripePriceId) {
        try {
          await stripe.prices.update(variant.stripePriceId, {
            active: false,
          });
        } catch (error) {
          // Error archiving Stripe price
        }
      }

      // Soft delete variant
      await ctx.prisma.productVariant.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return { success: true };
    }),
});
