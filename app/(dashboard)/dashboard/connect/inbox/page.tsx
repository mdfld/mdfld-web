"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import OrganizationInboxLayout from "@/components/dashboard/organizations/inbox/app";
import { useOrganizationStore } from "@/lib/stores/organization";
import { SpotlightTour } from "@/components/onboarding/spotlight-tour";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { useOnboarding } from "@/contexts/onboarding-context";
import { getTour } from "@/lib/onboarding-tours.config";

export const dynamic = "force-dynamic";

export default function ConnectInbox() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );
  const { shouldShowTour, markTourSeen } = useOnboarding();
  const [tourActive, setTourActive] = useState(false);
  const tour = getTour("connect");

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

  useEffect(() => {
    if (session && shouldShowTour("connect")) setTourActive(true);
  }, [session, shouldShowTour]);

  const handleTourEnd = async () => {
    setTourActive(false);
    await markTourSeen("connect");
  };

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
        <div data-onboarding="conversation-list" className="h-full">
          <OrganizationInboxLayout organizationId={activeOrganization.id} />
        </div>
        <div data-onboarding="response-time" className="hidden" />
      </SidebarWrapper>
      {tourActive && tour && (
        <SpotlightTour
          steps={tour.steps}
          onComplete={handleTourEnd}
          onSkip={handleTourEnd}
        />
      )}
      <TourTrigger onTrigger={() => setTourActive(true)} />
    </div>
  );
}
