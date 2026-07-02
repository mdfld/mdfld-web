"use client";

import React, { useState, useEffect, useRef } from "react";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import { useOnboarding } from "@/contexts/onboarding-context";
import { useAuth } from "@/hooks/use-auth";

export function WelcomeModalController() {
  const { state, isLoading } = useOnboarding();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || checked.current) return;
    checked.current = true;
    if (!state.tours.includes("signup" as any)) {
      setIsOpen(true);
    }
  }, [isLoading, isAuthenticated, state.tours]);

  if (!isOpen) return null;

  return <WelcomeModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
