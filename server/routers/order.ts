import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  stripe,
  calculateApplicationFee,
  formatAmountForStripe,
} from "@/lib/stripe";
import { calculateFraudScore } from "../services/fraud-detection";

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

export const orderRouter = createTRPCRouter({
  // Create order from cart (checkout)
  createFromCart: protectedProcedure
    .input(
      z.object({
        shippingAddressId: z.string().optional(),
        shippingAddress: z
          .object({
            name: z.string(),
            street: z.string(),
            city: z.string(),
            state: z.string(),
            postalCode: z.string(),
            country: z.string(),
          })
          .optional(),
        billingAddressId: z.string().optional(),
        billingAddress: z
          .object({
            name: z.string(),
            street: z.string(),
            city: z.string(),
            state: z.string(),
            postalCode: z.string(),
            country: z.string(),
          })
          .optional(),
        paymentMethodId: z.string(), // Stripe payment method ID
        saveAddress: z.boolean().default(false),
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

      // Get cart items
      const cartItems = await ctx.prisma.cartItem.findMany({
        where: { buyerProfileId: buyerProfile.id },
        include: {
          product: {
            include: {
              seller: true,
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

      // Get or validate shipping address
      let shippingAddress: any;
      if (input.shippingAddressId) {
        const address = await ctx.prisma.address.findUnique({
          where: { id: input.shippingAddressId },
        });
        if (!address || address.userId !== userId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Shipping address not found",
          });
        }
        shippingAddress = {
          name: address.name,
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        };
      } else if (input.shippingAddress) {
        shippingAddress = input.shippingAddress;
        // Save address if requested
        if (input.saveAddress) {
          await ctx.prisma.address.create({
            data: {
              userId,
              type: "SHIPPING",
              ...input.shippingAddress,
            },
          });
        }
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Shipping address is required",
        });
      }

      // Use shipping as billing if not provided
      const billingAddress =
        input.billingAddress || input.billingAddressId
          ? input.billingAddressId
            ? await ctx.prisma.address.findUnique({
                where: { id: input.billingAddressId },
              })
            : input.billingAddress
          : shippingAddress;

      // Group items by seller
      const ordersBySeller = cartItems.reduce((acc, item) => {
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
          item,
          price: Number(price),
          total: itemTotal,
        });
        acc[sellerId].subtotal += itemTotal;

        return acc;
      }, {} as any);

      // Calculate fraud score
      const fraudScore = await calculateFraudScore({
        userId,
        orderTotal: Object.values(ordersBySeller).reduce(
          (sum: number, group: any) => sum + group.subtotal,
          0,
        ),
        itemCount: cartItems.length,
        ipAddress:
          (ctx.req.headers["x-forwarded-for"] as string) ||
          ctx.req.socket.remoteAddress,
        userAgent: ctx.req.headers["user-agent"],
      });

      const isHighRisk = fraudScore > 0.7;
      const fraudFlags = [];
      if (fraudScore > 0.5) fraudFlags.push("ELEVATED_RISK");
      if (fraudScore > 0.7) fraudFlags.push("HIGH_RISK");
      if (fraudScore > 0.9) fraudFlags.push("VERY_HIGH_RISK");

      // Create orders for each seller
      const orders = [];

      for (const [sellerProfileId, sellerData] of Object.entries(
        ordersBySeller,
      )) {
        const data = sellerData as any;
        const orderNumber = generateOrderNumber();

        // Calculate fees
        const subtotal = data.subtotal;
        const taxRate = 0.08; // 8% tax
        const tax = subtotal * taxRate;
        const total = subtotal + tax;
        const applicationFee = calculateApplicationFee(total);

        // Create Stripe payment intent with Connect
        let paymentIntent;
        try {
          if (data.seller.stripeAccountId && data.seller.stripeChargesEnabled) {
            // Create payment intent with application fee for connected account
            paymentIntent = await stripe.paymentIntents.create({
              amount: formatAmountForStripe(total),
              currency: "usd",
              payment_method: input.paymentMethodId,
              confirmation_method: "manual",
              confirm: true,
              application_fee_amount: Math.round(applicationFee * 100),
              transfer_data: {
                destination: data.seller.stripeAccountId,
              },
              metadata: {
                orderNumber,
                buyerId: userId,
                sellerProfileId,
                platform: "mdfld",
              },
              // Add fraud prevention
              ...(isHighRisk && { capture_method: "manual" }), // Manual capture for high risk
            });
          } else {
            // Seller not connected to Stripe - hold payment on platform
            paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(total * 100),
              currency: "usd",
              payment_method: input.paymentMethodId,
              confirmation_method: "manual",
              confirm: true,
              metadata: {
                orderNumber,
                buyerId: userId,
                sellerProfileId,
                platform: "mdfld",
                holdForSeller: "true",
              },
            });
          }
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "Payment processing failed",
          });
        }

        // Create order in database
        const order = await ctx.prisma.order.create({
          data: {
            orderNumber,
            buyerProfileId: buyerProfile.id,
            sellerProfileId,
            organizationId: data.seller.organizationId,
            status: isHighRisk ? "PENDING" : "CONFIRMED",
            subtotal,
            tax,
            shipping: 0, // Calculate based on items/location
            total,
            paymentMethod: "STRIPE",
            paymentStatus:
              paymentIntent.status === "succeeded" ? "CAPTURED" : "AUTHORIZED",
            stripePaymentIntentId: paymentIntent.id,
            applicationFeeAmount: applicationFee,
            ipAddress:
              (ctx.req.headers["x-forwarded-for"] as string) ||
              ctx.req.socket.remoteAddress,
            deviceFingerprint: ctx.req.headers[
              "x-device-fingerprint"
            ] as string,
            riskScore: fraudScore,
            isHighRisk,
            fraudFlags,
            verificationRequired: isHighRisk,
            shippingAddress,
            billingAddress,
            items: {
              create: data.items.map((item: any) => ({
                productId: item.item.productId,
                variantId: item.item.variantId,
                quantity: item.item.quantity,
                price: item.price,
                sizeDisplay: item.item.variant?.sizeDisplay,
                color: item.item.variant?.color,
              })),
            },
          },
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        });

        // Update inventory
        for (const item of data.items) {
          if (item.item.variantId) {
            await ctx.prisma.productVariant.update({
              where: { id: item.item.variantId },
              data: {
                inventory: {
                  decrement: item.item.quantity,
                },
              },
            });
          } else {
            await ctx.prisma.product.update({
              where: { id: item.item.productId },
              data: {
                inventory: {
                  decrement: item.item.quantity,
                },
              },
            });
          }
        }

        // Create fraud alert if high risk
        if (isHighRisk) {
          await ctx.prisma.fraudAlert.create({
            data: {
              orderId: order.id,
              alertType: "SUSPICIOUS_TRANSACTION",
              severity: fraudScore > 0.9 ? "CRITICAL" : "HIGH",
              description: `High risk order detected. Fraud score: ${fraudScore.toFixed(2)}`,
              riskScore: fraudScore,
              triggerRules: fraudFlags,
              metadata: {
                paymentIntentId: paymentIntent.id,
                ipAddress: ctx.req.headers["x-forwarded-for"] as string,
                userAgent: ctx.req.headers["user-agent"],
              },
            },
          });
        }

        // Send order confirmation notification
        await ctx.prisma.notification.create({
          data: {
            userId,
            type: "ORDER_UPDATE",
            title: "Order Confirmed",
            content: `Your order #${orderNumber} has been confirmed and is being processed.`,
            metadata: {
              orderId: order.id,
              orderNumber,
            },
          },
        });

        orders.push(order);
      }

      // Clear cart after successful order
      await ctx.prisma.cartItem.deleteMany({
        where: { buyerProfileId: buyerProfile.id },
      });

      // Update buyer metrics
      await ctx.prisma.buyerProfile.update({
        where: { id: buyerProfile.id },
        data: {
          totalOrders: { increment: orders.length },
          averageOrderValue: {
            set: await ctx.prisma.order
              .aggregate({
                where: { buyerProfileId: buyerProfile.id },
                _avg: { total: true },
              })
              .then((result) => Number(result._avg.total) || 0),
          },
        },
      });

      return { orders, success: true };
    }),

  // Get user's orders
  getMyOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        status: z
          .enum([
            "all",
            "pending",
            "confirmed",
            "processing",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
          ])
          .default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Get buyer profile
      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
      });

      if (!buyerProfile) {
        return { items: [], nextCursor: undefined };
      }

      const where: any = {
        buyerProfileId: buyerProfile.id,
      };

      if (input.status !== "all") {
        where.status = input.status.toUpperCase();
      }

      const items = await ctx.prisma.order.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                include: {
                  seller: true,
                },
              },
              variant: true,
            },
          },
          seller: {
            include: {
              organization: true,
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

  // Get order by ID
  getById: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          buyer: {
            include: {
              user: true,
            },
          },
          seller: {
            include: {
              organization: true,
            },
          },
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          transactions: true,
          fraudAlerts: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Check if user has access to this order
      const hasAccess =
        order.buyer.userId === userId ||
        (order.seller.userId && order.seller.userId === userId) ||
        (order.seller.organizationId &&
          (await ctx.prisma.organizationMember.findFirst({
            where: {
              organizationId: order.seller.organizationId,
              userId,
            },
          })));

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this order",
        });
      }

      return order;
    }),

  // Update order status (for sellers)
  updateStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([
          "CONFIRMED",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ]),
        trackingNumber: z.string().optional(),
        trackingCarrier: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          seller: true,
          buyer: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Check if user is the seller
      const isSeller =
        (order.seller.userId && order.seller.userId === userId) ||
        (order.seller.organizationId &&
          (await ctx.prisma.organizationMember.findFirst({
            where: {
              organizationId: order.seller.organizationId,
              userId,
              role: { in: ["owner", "admin"] },
            },
          })));

      if (!isSeller) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only sellers can update order status",
        });
      }

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["PROCESSING", "CANCELLED"],
        PROCESSING: ["SHIPPED", "CANCELLED"],
        SHIPPED: ["DELIVERED"],
        DELIVERED: [],
        CANCELLED: [],
        REFUNDED: [],
      };

      if (!validTransitions[order.status]?.includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${order.status} to ${input.status}`,
        });
      }

      // Handle payment capture for confirmed high-risk orders
      if (
        input.status === "PROCESSING" &&
        order.isHighRisk &&
        order.stripePaymentIntentId
      ) {
        try {
          await stripe.paymentIntents.capture(order.stripePaymentIntentId);
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to capture payment",
          });
        }
      }

      // Update order
      const updatedOrder = await ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          status: input.status,
          ...(input.trackingNumber && {
            notes: `Tracking: ${input.trackingCarrier || "Carrier"} - ${input.trackingNumber}`,
          }),
        },
      });

      // Send notification to buyer
      await ctx.prisma.notification.create({
        data: {
          userId: order.buyer.userId,
          type: "ORDER_UPDATE",
          title: "Order Status Updated",
          content: `Your order #${order.orderNumber} is now ${input.status.toLowerCase()}.${
            input.trackingNumber ? ` Tracking: ${input.trackingNumber}` : ""
          }`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: input.status,
            trackingNumber: input.trackingNumber,
          },
        },
      });

      return updatedOrder;
    }),

  // Cancel order
  cancel: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          buyer: true,
          seller: true,
          items: {
            include: {
              variant: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      // Check if user can cancel (buyer or seller)
      const canCancel =
        order.buyer.userId === userId ||
        (order.seller.userId && order.seller.userId === userId) ||
        (order.seller.organizationId &&
          (await ctx.prisma.organizationMember.findFirst({
            where: {
              organizationId: order.seller.organizationId,
              userId,
            },
          })));

      if (!canCancel) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot cancel this order",
        });
      }

      // Check if order can be cancelled
      if (!["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order cannot be cancelled in current status",
        });
      }

      // Process refund if payment was captured
      if (order.paymentStatus === "CAPTURED" && order.stripePaymentIntentId) {
        try {
          await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            reason: "requested_by_customer",
          });
        } catch (error: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process refund",
          });
        }
      }

      // Update order status
      const updatedOrder = await ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          status: "CANCELLED",
          paymentStatus:
            order.paymentStatus === "CAPTURED" ? "REFUNDED" : "CANCELLED",
          notes: `Cancelled by ${order.buyer.userId === userId ? "buyer" : "seller"}: ${input.reason}`,
        },
      });

      // Restore inventory
      for (const item of order.items) {
        if (item.variantId) {
          await ctx.prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              inventory: {
                increment: item.quantity,
              },
            },
          });
        } else {
          await ctx.prisma.product.update({
            where: { id: item.productId },
            data: {
              inventory: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Send notifications
      const cancelledBy = order.buyer.userId === userId ? "buyer" : "seller";
      const notifyUserId =
        cancelledBy === "buyer"
          ? order.seller.userId || ""
          : order.buyer.userId;

      if (notifyUserId) {
        await ctx.prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: "ORDER_UPDATE",
            title: "Order Cancelled",
            content: `Order #${order.orderNumber} has been cancelled by the ${cancelledBy}.`,
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              cancelledBy,
              reason: input.reason,
            },
          },
        });
      }

      return updatedOrder;
    }),
});
