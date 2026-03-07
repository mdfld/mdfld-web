"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import { type AppRouter } from "@/server";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10,   // 10 minutes
            // Don't retry on UNAUTHORIZED — user just isn't logged in
            retry: (failureCount, error: any) => {
              if (error?.data?.httpStatus === 401) return false;
              if (error?.data?.code === "UNAUTHORIZED") return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) => {
            // Never log UNAUTHORIZED errors — expected when user isn't logged in
            if (
              opts.direction === "down" &&
              opts.result instanceof Error &&
              (opts.result as any)?.data?.code === "UNAUTHORIZED"
            ) {
              return false;
            }
            // Only log in dev for non-auth errors, or on actual server errors
            return (
              process.env.NODE_ENV === "development" ||
              (opts.direction === "down" && opts.result instanceof Error)
            );
          },
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {};
          },
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}