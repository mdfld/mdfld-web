import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const cartRouter = createTRPCRouter({
  // Get user's cart
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get or create buyer profile
    let buyerProfile = await ctx.prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!buyerProfile) {
      buyerProfile = await ctx.prisma.buyerProfile.create({
        data: { userId },
      });
    }

    const cartItems = await ctx.prisma.cartItem.findMany({
      where: { buyerProfileId: buyerProfile.id },
      include: {
        product: {
          include: {
            seller: true,
            organization: true,
          },
        },
        variant: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.variant?.price || item.product.price;
      return sum + Number(price) * item.quantity;
    }, 0);

    return {
      items: cartItems,
      subtotal,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }),

  // Add item to cart
  addItem: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        variantId: z.string().optional(),
        quantity: z.number().min(1).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get or create buyer profile
      let buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        buyerProfile = await ctx.prisma.buyerProfile.create({
          data: { userId },
        });
      }

      // Verify product exists and is active
      const product = await ctx.prisma.product.findUnique({
        where: { id: input.productId },
        include: { variants: true },
      });

      if (!product || !product.isActive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found or unavailable",
        });
      }

      // Verify variant if provided
      let variant = null;
      if (input.variantId) {
        variant = await ctx.prisma.productVariant.findUnique({
          where: { id: input.variantId },
        });

        if (!variant || variant.productId !== input.productId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product variant not found",
          });
        }

        // Check variant inventory
        if (variant.inventory < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient inventory",
          });
        }
      } else {
        // Check product inventory
        if (product.inventory < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient inventory",
          });
        }
      }

      // Check if item already in cart
      const existingItem = await ctx.prisma.cartItem.findFirst({
        where: {
          buyerProfileId: buyerProfile.id,
          productId: input.productId,
          variantId: input.variantId || null,
        },
      });

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + input.quantity;
        const availableInventory = variant?.inventory || product.inventory;

        if (newQuantity > availableInventory) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient inventory for requested quantity",
          });
        }

        return ctx.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
          include: {
            product: true,
            variant: true,
          },
        });
      }

      // Create new cart item
      return ctx.prisma.cartItem.create({
        data: {
          buyerProfileId: buyerProfile.id,
          productId: input.productId,
          variantId: input.variantId,
          quantity: input.quantity,
        },
        include: {
          product: true,
          variant: true,
        },
      });
    }),

  // Update item quantity
  updateQuantity: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        quantity: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get buyer profile
      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Buyer profile not found",
        });
      }

      // Get cart item
      const cartItem = await ctx.prisma.cartItem.findUnique({
        where: { id: input.itemId },
        include: {
          product: true,
          variant: true,
        },
      });

      if (!cartItem || cartItem.buyerProfileId !== buyerProfile.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart item not found",
        });
      }

      // If quantity is 0, remove item
      if (input.quantity === 0) {
        await ctx.prisma.cartItem.delete({
          where: { id: input.itemId },
        });
        return { removed: true };
      }

      // Check inventory
      const availableInventory =
        cartItem.variant?.inventory || cartItem.product.inventory;
      if (input.quantity > availableInventory) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient inventory",
        });
      }

      // Update quantity
      return ctx.prisma.cartItem.update({
        where: { id: input.itemId },
        data: { quantity: input.quantity },
        include: {
          product: true,
          variant: true,
        },
      });
    }),

  // Remove item from cart
  removeItem: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get buyer profile
      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Buyer profile not found",
        });
      }

      // Verify item belongs to user
      const cartItem = await ctx.prisma.cartItem.findUnique({
        where: { id: input.itemId },
      });

      if (!cartItem || cartItem.buyerProfileId !== buyerProfile.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart item not found",
        });
      }

      await ctx.prisma.cartItem.delete({
        where: { id: input.itemId },
      });

      return { success: true };
    }),

  // Clear entire cart
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get buyer profile
    const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!buyerProfile) {
      return { success: true };
    }

    await ctx.prisma.cartItem.deleteMany({
      where: { buyerProfileId: buyerProfile.id },
    });

    return { success: true };
  }),

  // Get cart summary for checkout
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get buyer profile
    const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
      where: { userId },
    });

    if (!buyerProfile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No items in cart",
      });
    }

    const cartItems = await ctx.prisma.cartItem.findMany({
      where: { buyerProfileId: buyerProfile.id },
      include: {
        product: {
          include: {
            seller: {
              include: {
                organization: true,
              },
            },
          },
        },
        variant: true,
      },
    });

    if (cartItems.length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cart is empty",
      });
    }

    // Group items by seller
    const itemsBySeller = cartItems.reduce((acc, item) => {
      const sellerId = item.product.sellerProfileId;
      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: item.product.seller,
          items: [],
          subtotal: 0,
        };
      }

      const price = item.variant?.price || item.product.price;
      const itemTotal = Number(price) * item.quantity;

      acc[sellerId].items.push({
        ...item,
        price: Number(price),
        total: itemTotal,
      });
      acc[sellerId].subtotal += itemTotal;

      return acc;
    }, {} as any);

    // Calculate totals
    const subtotal = Object.values(itemsBySeller).reduce(
      (sum: number, group: any) => sum + group.subtotal,
      0,
    );

    // Simple tax calculation (you may want to use a tax API)
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      itemsBySeller,
      subtotal,
      tax,
      shipping: 0, // Calculate based on items/location
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  }),

  // Merge guest cart items into authenticated cart
  mergeGuestCart: protectedProcedure
    .input(
      z.object({
        guestItems: z.array(
          z.object({
            productId: z.string(),
            variantId: z.string().optional(),
            quantity: z.number().min(1),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get or create buyer profile
      let buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        buyerProfile = await ctx.prisma.buyerProfile.create({
          data: { userId },
        });
      }

      // Process each guest cart item
      for (const guestItem of input.guestItems) {
        try {
          // Verify product exists
          const product = await ctx.prisma.product.findUnique({
            where: { id: guestItem.productId },
            include: { variants: true },
          });

          if (!product || !product.isActive) {
            continue; // Skip invalid products
          }

          // Verify variant if provided
          let variant = null;
          if (guestItem.variantId) {
            variant = await ctx.prisma.productVariant.findUnique({
              where: { id: guestItem.variantId },
            });

            if (!variant || variant.productId !== guestItem.productId) {
              continue; // Skip invalid variants
            }
          }

          // Check if item already in cart
          const existingItem = await ctx.prisma.cartItem.findFirst({
            where: {
              buyerProfileId: buyerProfile.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId || null,
            },
          });

          if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + guestItem.quantity;
            const availableInventory = variant?.inventory || product.inventory;

            if (newQuantity <= availableInventory) {
              await ctx.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
              });
            }
          } else {
            // Create new cart item
            const availableInventory = variant?.inventory || product.inventory;
            if (guestItem.quantity <= availableInventory) {
              await ctx.prisma.cartItem.create({
                data: {
                  buyerProfileId: buyerProfile.id,
                  productId: guestItem.productId,
                  variantId: guestItem.variantId,
                  quantity: guestItem.quantity,
                },
              });
            }
          }
        } catch (error) {
          // Log error but continue processing other items
          console.error("Error merging guest cart item:", error);
        }
      }

      return { success: true };
    }),
});
