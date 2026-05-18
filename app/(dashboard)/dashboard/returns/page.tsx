"use client";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SidebarWrapper from "@/components/sidebar/dashboard/app";
import ReturnsLayout from "@/components/dashboard/returns/app";
import { SpotlightTour } from "@/components/onboarding/spotlight-tour";
import { TourTrigger } from "@/components/onboarding/tour-trigger";
import { useOnboarding } from "@/contexts/onboarding-context";
import { getTour } from "@/lib/onboarding-tours.config";

export const dynamic = "force-dynamic";

export default function Returns() {
  const { data: session, isPending: sessionPending } = useSession();
  const router = useRouter();
  const { shouldShowTour, markTourSeen } = useOnboarding();
  const [tourActive, setTourActive] = useState(false);
  const tour = getTour("returns");

  useEffect(() => {
    if (!sessionPending && !session) {
      router.push("/auth/login");
    }
  }, [session, sessionPending, router]);

  useEffect(() => {
    if (session && shouldShowTour("returns")) setTourActive(true);
  }, [session, shouldShowTour]);

  const handleTourEnd = async () => {
    setTourActive(false);
    await markTourSeen("returns");
  };

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
          <div data-onboarding="returns-policy" className="hidden" />
          <div data-onboarding="returns-cta" className="hidden" />
          <ReturnsLayout />
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
