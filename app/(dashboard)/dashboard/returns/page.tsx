"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import ReturnsLayout from "@/components/dashboard/returns/app";

export const dynamic = "force-dynamic";

export default function Returns() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/auth/login");
    }
  }, [session, sessionPending, router]);

  if (typeof window === "undefined" || sessionPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <SidebarWrapper>
        <div className="flex-1 p-4 overflow-y-auto">
          <ReturnsLayout />
        </div>
      </SidebarWrapper>
    </div>
  );
}
