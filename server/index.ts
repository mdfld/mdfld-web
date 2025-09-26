import { createTRPCRouter } from "./trpc";
import { chatRouter } from "./routers/chat";
import { userRouter } from "./routers/user";
import { notificationRouter } from "./routers/notification";
import { organizationRouter } from "./routers/organization";
import { adminRouter } from "./routers/admin";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  user: userRouter,
  notification: notificationRouter,
  organization: organizationRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
