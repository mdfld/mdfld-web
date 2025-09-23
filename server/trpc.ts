import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import superjson from "superjson";
import { ZodError } from "zod";

interface CreateContextOptions {
  req: CreateNextContextOptions["req"];
  res: CreateNextContextOptions["res"];
}

export const createTRPCContext = async (opts: CreateContextOptions) => {
  const { req, res } = opts;

  // Get the session from the auth library
  const session = await auth.api.getSession({
    headers: req.headers as any,
  });

  return {
    req,
    res,
    session,
    user: session?.user || null,
    prisma,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
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
    throw new TRPCError({ code: "UNAUTHORIZED" });
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
