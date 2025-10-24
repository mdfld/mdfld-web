"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import OrganizationInboxLayout from "@/components/dashboard/organizations/inbox/app";
import { useOrganizationStore } from "@/lib/stores/organization";

export const dynamic = "force-dynamic";

export default function OrganizationInbox() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isPending && session && !activeOrganization) {
      router.push("/dashboard");
    }
  }, [activeOrganization, session, isPending, router]);

  if (typeof window === "undefined" || isPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session || !activeOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <SidebarWrapper>
        <OrganizationInboxLayout organizationId={activeOrganization.id} />
      </SidebarWrapper>
    </div>
  );
}
