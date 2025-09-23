"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Toaster } from "sonner";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <TRPCProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          {children}
          <ToastProvider placement="bottom-right" />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "heroui-toast",
              style: {
                background: "hsl(var(--heroui-content1))",
                color: "hsl(var(--heroui-foreground))",
                border: "1px solid hsl(var(--heroui-divider))",
              },
            }}
          />
        </NextThemesProvider>
      </HeroUIProvider>
    </TRPCProvider>
  );
}
