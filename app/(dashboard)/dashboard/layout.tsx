"use client";

import "@/styles/globals.css";
import clsx from "clsx";
import { fontSans } from "@/config/fonts";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen overflow-hidden">{children}</div>;
}
