"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import OrganizationTeamLayout from "@/components/dashboard/organizations/team/app";
import { useOrganizationStore } from "@/lib/stores/organization";

export const dynamic = "force-dynamic";

export default function OrganizationTeam() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/auth/login");
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (!activeOrganization && !sessionPending && session) {
      // Redirect to select organization or dashboard
      router.push("/dashboard");
    }
  }, [activeOrganization, sessionPending, session, router]);

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

  if (!activeOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Please select an organization first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <SidebarWrapper>
        <div className="flex-1 p-4 overflow-y-auto">
          <OrganizationTeamLayout organizationSlug={activeOrganization.slug} />
        </div>
      </SidebarWrapper>
    </div>
  );
}
