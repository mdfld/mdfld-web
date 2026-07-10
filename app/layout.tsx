// app/layout.tsx  (server component)
import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Providers } from "./providers";
import { siteConfig } from "@/config/site";
import { fontMono, fontSans } from "@/config/fonts";

export const metadata: Metadata = {
  metadataBase: new URL("https://mdfld.co"),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: "MDFLD — The Football Marketplace",
    description: "Buy and sell authentic football boots, kits, and gear. Verified. Global.",
    url: "https://mdfld.co",
    siteName: "MDFLD",
    images: [
      {
        url: "/mdfld-logo-v2.png",
        width: 800,
        height: 400,
        alt: "MDFLD — The Football Marketplace",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MDFLD — The Football Marketplace",
    description: "Buy and sell authentic football boots, kits, and gear. Verified. Global.",
    images: ["/mdfld-logo-v2.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
          fontMono.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
