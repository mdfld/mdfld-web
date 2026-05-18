"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import { ChecklistPanel } from "@/components/onboarding/checklist-panel";
import { SpotlightTour } from "@/components/onboarding/spotlight-tour";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { useOnboarding } from "@/contexts/onboarding-context";
import { getTour } from "@/lib/onboarding-tours.config";
import { useOrganizationStore } from "@/lib/stores/organization";

export const dynamic = "force-dynamic";

export default function OrganizationSetup() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const activeOrganization = useOrganizationStore(
    (state) => state.activeOrganization,
  );
  const { shouldShowTour, markTourSeen } = useOnboarding();
  const [tourActive, setTourActive] = useState(false);
  const tour = getTour("org-setup");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && shouldShowTour("org-setup")) {
      setTourActive(true);
    }
  }, [session, shouldShowTour]);

  const handleTourEnd = async () => {
    setTourActive(false);
    await markTourSeen("org-setup");
  };

  if (typeof window === "undefined" || isPending) {
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
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-medium">Organization Setup</h1>
              <p className="text-sm text-default-500 mt-1">
                Complete your store setup to start selling on MDFLD.
              </p>
            </div>

            <div data-onboarding="org-checklist">
              <ChecklistPanel type="seller" />
            </div>

            {/* Hidden anchor for org-name-field tour step */}
            <div data-onboarding="org-name-field" className="hidden" />

            <div className="space-y-4">
              <p className="text-default-600 text-sm">
                Manage your organization from the links below:
              </p>
              <div className="flex flex-col gap-2">
                <button
                  className="text-left px-4 py-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors text-sm"
                  onClick={() =>
                    router.push("/dashboard/organization/settings")
                  }
                >
                  Organization Settings
                </button>
                <button
                  className="text-left px-4 py-3 rounded-lg bg-default-100 hover:bg-default-200 transition-colors text-sm"
                  onClick={() =>
                    router.push("/dashboard/organization/listings")
                  }
                >
                  Manage Listings
                </button>
              </div>
            </div>
          </div>
        </div>
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
