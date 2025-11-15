"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import OrganizationOrdersLayout from "@/components/dashboard/organizations/orders/app";
import { trpc } from "@/lib/trpc-client";
import { useOrganizationStore } from "@/lib/stores/organization";

export const dynamic = "force-dynamic";

export default function OrganizationOrders() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );

  const { data: organization, isLoading: orgPending } =
    trpc.organization.get.useQuery(
      { slug: activeOrganization?.slug || "" },
      { enabled: !!activeOrganization?.slug && !!session },
    ) as any;

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/auth/login");
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (!activeOrganization && !sessionPending && session) {
      router.push("/dashboard");
    }
  }, [activeOrganization, sessionPending, session, router]);

  if (typeof window === "undefined" || sessionPending || orgPending) {
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

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">Organization not found</p>
        </div>
      </div>
    );
  }

  if (
    !organization?.role ||
    (organization?.role !== "owner" && organization?.role !== "admin")
  ) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600">
            You don't have permission to access organization orders
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <SidebarWrapper>
        <div className="flex-1 p-4 overflow-y-auto">
          <OrganizationOrdersLayout />
        </div>
      </SidebarWrapper>
    </div>
  );
}
