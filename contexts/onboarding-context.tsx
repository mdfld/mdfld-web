"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { EMPTY_ONBOARDING_STATE } from "@/types/onboarding";
import type { OnboardingState } from "@/types/onboarding";

interface OnboardingContextValue {
  state: OnboardingState;
  isLoading: boolean;
  completeStep: (id: string, stepType: "buyer" | "seller") => Promise<void>;
  markTourSeen: (pageId: string) => Promise<void>;
  shouldShowTour: (pageId: string) => boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_ONBOARDING_ENABLED === "true";
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<OnboardingState>({ ...EMPTY_ONBOARDING_STATE });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data: OnboardingState) => setState(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const completeStep = useCallback(
    async (id: string, stepType: "buyer" | "seller") => {
      const array = stepType === "buyer" ? state.buyer : state.seller;
      if (array.includes(id as any)) return;
      setState((prev) => ({
        ...prev,
        [stepType]: [...prev[stepType], id as any],
      }));
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: id, stepType }),
      });
    },
    [state],
  );

  const markTourSeen = useCallback(
    async (pageId: string) => {
      if (state.tours.includes(pageId as any)) return;
      setState((prev) => ({ ...prev, tours: [...prev.tours, pageId as any] }));
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour: pageId }),
      });
    },
    [state.tours],
  );

  const shouldShowTour = useCallback(
    (pageId: string) => !isLoading && isAuthenticated && !state.tours.includes(pageId as any),
    [isLoading, isAuthenticated, state.tours],
  );

  if (!enabled) return <>{children}</>;

  return (
    <OnboardingContext.Provider value={{ state, isLoading, completeStep, markTourSeen, shouldShowTour }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
