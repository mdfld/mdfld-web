import { createTRPCRouter } from "./trpc";
import { chatRouter } from "./routers/chat";
import { userRouter } from "./routers/user";
import { notificationRouter } from "./routers/notification";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  user: userRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
