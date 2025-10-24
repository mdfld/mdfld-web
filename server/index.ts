import { createTRPCRouter } from "./trpc";
import { chatRouter } from "./routers/chat";
import { userRouter } from "./routers/user";
import { notificationRouter } from "./routers/notification";
import { organizationRouter } from "./routers/organization";
import { adminRouter } from "./routers/admin";
import { stripeRouter } from "./routers/stripe";
import { productRouter } from "./routers/product";
import { cartRouter } from "./routers/cart";
import { orderRouter } from "./routers/order";
import { reviewRouter } from "./routers/review";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  user: userRouter,
  notification: notificationRouter,
  organization: organizationRouter,
  admin: adminRouter,
  stripe: stripeRouter,
  product: productRouter,
  cart: cartRouter,
  order: orderRouter,
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;
