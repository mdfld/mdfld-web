import { Fira_Code as FontMono } from "next/font/google";
import localFont from "next/font/local";

export const fontSans = localFont({
  src: [
    {
      path: "../public/fonts/gordita/Gordita-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/gordita/Gordita-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/gordita/Gordita-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/gordita/Gordita-RegularItalic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/gordita/Gordita-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/gordita/Gordita-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/gordita/Gordita-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/gordita/Gordita-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/gordita/Gordita-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../public/fonts/gordita/Gordita-BlackItalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-sans",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});
