import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// const superjson = require("superjson");
import { ZodError } from "zod";

interface CreateContextOptions {
  req: CreateNextContextOptions["req"];
  res: CreateNextContextOptions["res"];
}

export const createTRPCContext = async (opts: CreateContextOptions) => {
  const { req, res } = opts;

  try {
    // Get the session from the auth library
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    // Debug logging
    if (!session && process.env.NODE_ENV === "development") {
      console.log("No session found, headers:", Object.keys(req.headers));
    }

    return {
      req,
      res,
      session,
      user: session?.user || null,
      prisma,
    };
  } catch (error) {
    console.error("Error getting session in TRPC context:", error);
    return {
      req,
      res,
      session: null,
      user: null,
      prisma,
    };
  }
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    console.error("Authentication failed in TRPC:", {
      hasSession: !!ctx.session,
      hasUser: !!ctx.user,
      userId: ctx.user?.id,
    });
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session },
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
