"use client";

import React, { useState, useEffect } from "react";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { useOnboarding } from "@/contexts/onboarding-context";

export function WelcomeModalController() {
  const { shouldShowTour, isLoading } = useOnboarding();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && shouldShowTour("signup")) {
      setIsOpen(true);
    }
  }, [isLoading, shouldShowTour]);

  if (!isOpen) return null;

  return <WelcomeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
