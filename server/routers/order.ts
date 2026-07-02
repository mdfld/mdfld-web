import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { stripe } from "@/lib/stripe";
import { createOrGetTracking } from "@/lib/aftership";
import { buyShippingLabel } from "@/lib/easypost";

export const orderRouter = createTRPCRouter({
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

      const buyerProfile = await ctx.prisma.buyerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!buyerProfile) {
        return { items: [], nextCursor: undefined };
      }

      const where: any = { buyerProfileId: buyerProfile.id };

      if (input.status !== "all") {
        where.status = input.status.toUpperCase();
      }

      const items = await ctx.prisma.order.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          subtotal: true,
          shipping: true,
          tax: true,
          total: true,
          shippingAddress: true,
          createdAt: true,
          seller: {
            select: {
              id: true,
              storeName: true,
            },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              price: true,
              sizeDisplay: true,
              color: true,
              product: {
                select: {
                  id: true,
                  title: true,
                  images: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  sizeDisplay: true,
                  color: true,
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

      return { items, nextCursor };
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

      // Capture payment for high-risk orders moving to PROCESSING
      if (
        input.status === "PROCESSING" &&
        order.isHighRisk &&
        order.stripePaymentIntentId
      ) {
        try {
          await stripe.paymentIntents.capture(order.stripePaymentIntentId);
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to capture payment",
          });
        }
      }

      const [updatedOrder] = await Promise.all([
        ctx.prisma.order.update({
          where: { id: input.orderId },
          data: {
            status: input.status,
            ...(input.trackingNumber && {
              notes: `Tracking: ${input.trackingCarrier || "Carrier"} - ${input.trackingNumber}`,
            }),
          },
        }),
        ctx.prisma.notification.create({
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
        }),
      ]);

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

      if (!["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order cannot be cancelled in current status",
        });
      }

      if (order.paymentStatus === "CAPTURED" && order.stripePaymentIntentId) {
        try {
          await stripe.refunds.create({
            payment_intent: order.stripePaymentIntentId,
            reason: "requested_by_customer",
          });
        } catch {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to process refund",
          });
        }
      }

      const cancelledBy = order.buyer.userId === userId ? "buyer" : "seller";
      const notifyUserId =
        cancelledBy === "buyer" ? order.seller.userId || "" : order.buyer.userId;

      // Run update, inventory restore, and notification in parallel
      const [updatedOrder] = await Promise.all([
        ctx.prisma.order.update({
          where: { id: input.orderId },
          data: {
            status: "CANCELLED",
            paymentStatus:
              order.paymentStatus === "CAPTURED" ? "REFUNDED" : "CANCELLED",
            notes: `Cancelled by ${cancelledBy}: ${input.reason}`,
          },
        }),
        Promise.all(
          order.items.map(async (item) => {
            if (item.variantId) {
              return ctx.prisma.productVariant.update({
                where: { id: item.variantId },
                data: { inventory: { increment: item.quantity } },
              });
            }
            const updated = await ctx.prisma.product.update({
              where: { id: item.productId },
              data: { inventory: { increment: item.quantity }, isActive: true },
            });
            return updated;
          }),
        ),
        notifyUserId
          ? ctx.prisma.notification.create({
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
            })
          : Promise.resolve(null),
      ]);

      return updatedOrder;
    }),

  submitTracking: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        trackingNumber: z.string().min(1),
        trackingCarrier: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          seller: true,
          buyer: { include: { user: true } },
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

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
          message: "Only sellers can submit tracking",
        });
      }

      if (!["CONFIRMED", "PROCESSING", "SHIPPED"].includes(order.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Order must be confirmed or processing to add tracking",
        });
      }

      // Call AfterShip to verify and get initial status
      const { tag, carrierConfirmed } = await createOrGetTracking(
        input.trackingNumber,
        input.trackingCarrier,
      );

      const now = new Date();

      const carrierConfirmedAt = carrierConfirmed ? now : order.carrierConfirmedAt;

      const justConfirmed = carrierConfirmed && !order.carrierConfirmedAt;

      await Promise.all([
        ctx.prisma.order.update({
          where: { id: input.orderId },
          data: {
            status: "SHIPPED",
            trackingNumber: input.trackingNumber,
            trackingCarrier: input.trackingCarrier,
            trackingStatus: tag,
            carrierConfirmedAt,
          },
        }),
        ctx.prisma.notification.create({
          data: {
            userId: order.buyer.userId,
            type: "ORDER_UPDATE",
            title: "Your order has shipped",
            content: `Order #${order.orderNumber} is on its way via ${input.trackingCarrier}. Tracking: ${input.trackingNumber}`,
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              trackingNumber: input.trackingNumber,
              trackingCarrier: input.trackingCarrier,
            },
          },
        }),
        ...(justConfirmed
          ? [
              ctx.prisma.sellerProfile.update({
                where: { id: order.sellerProfileId },
                data: {
                  lockedBalance: {
                    decrement: Number(order.subtotal) - Number(order.applicationFeeAmount ?? 0),
                  },
                },
              }),
            ]
          : []),
      ]);

      return {
        orderId: input.orderId,
        trackingNumber: input.trackingNumber,
        trackingCarrier: input.trackingCarrier,
        trackingStatus: tag,
        carrierConfirmedAt: carrierConfirmedAt?.toISOString() ?? null,
        carrierConfirmed,
        message: carrierConfirmed
          ? "Tracking confirmed. Your earnings for this order are now available for withdrawal."
          : "Tracking saved. Earnings for this order will become available once the carrier confirms pickup.",
      };
    }),

  buyLabel: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const order = await ctx.prisma.order.findUnique({
        where: { id: input.orderId },
        include: {
          seller: true,
          buyer: true,
          organization: true,
          items: { include: { product: { select: { weight: true, dimensions: true } } } },
        },
      });

      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

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

      if (!isSeller) throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can buy a label" });

      if (!["CONFIRMED", "PROCESSING"].includes(order.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order must be CONFIRMED or PROCESSING to buy a label" });
      }

      if (order.labelUrl) {
        return {
          labelUrl: order.labelUrl,
          labelTrackingNumber: order.labelTrackingNumber,
          labelCarrier: order.labelCarrier,
        };
      }

      const fromAddress = {
        street:  order.organization?.addressStreet  ?? "",
        city:    order.organization?.addressCity    ?? "",
        state:   order.organization?.addressState   ?? "",
        zip:     order.organization?.addressZip     ?? "",
        country: order.organization?.addressCountry ?? "US",
      };

      if (!fromAddress.street || !fromAddress.city || !fromAddress.state || !fromAddress.zip) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Seller address is incomplete. Update your organization address before buying a label." });
      }

      const ship = order.shippingAddress as any;
      const toAddress = {
        name:    ship.name    ?? "",
        street:  ship.street  ?? ship.street1 ?? "",
        city:    ship.city    ?? "",
        state:   ship.state   ?? "",
        zip:     ship.zip     ?? ship.postalCode ?? "",
        country: ship.country ?? "US",
      };

      if (!toAddress.zip) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Buyer shipping address is missing a zip code." });
      }

      let totalWeightOz = 0;
      let maxLength = 0, maxWidth = 0, maxHeight = 0;
      let hasDimensions = false;

      for (const item of order.items) {
        const p = item.product;
        if (p.weight) totalWeightOz += p.weight * item.quantity;
        const dims = p.dimensions as any;
        if (dims?.length && dims?.width && dims?.height) {
          hasDimensions = true;
          maxLength = Math.max(maxLength, dims.length);
          maxWidth  = Math.max(maxWidth,  dims.width);
          maxHeight = Math.max(maxHeight, dims.height);
        }
      }

      const parcel = (totalWeightOz > 0 && hasDimensions)
        ? { weightOz: totalWeightOz, length: maxLength, width: maxWidth, height: maxHeight }
        : null;

      const label = await buyShippingLabel({
        fromAddress,
        toAddress,
        parcel,
        reference: order.orderNumber,
      });

      await ctx.prisma.order.update({
        where: { id: input.orderId },
        data: {
          easypostShipmentId:  label.shipmentId,
          labelUrl:            label.labelUrl,
          labelTrackingNumber: label.trackingNumber,
          labelCarrier:        label.carrier,
          labelBoughtAt:       new Date(),
          trackingNumber:      label.trackingNumber,
          trackingCarrier:     label.carrier,
        },
      });

      await createOrGetTracking(label.trackingNumber, label.carrier);

      return {
        labelUrl: label.labelUrl,
        labelTrackingNumber: label.trackingNumber,
        labelCarrier: label.carrier,
      };
    }),
});
