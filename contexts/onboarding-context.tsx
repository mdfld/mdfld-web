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
  setSellerOptIn: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const noopValue: OnboardingContextValue = {
  state: { ...EMPTY_ONBOARDING_STATE },
  isLoading: false,
  completeStep: async () => {},
  markTourSeen: async () => {},
  shouldShowTour: () => false,
  setSellerOptIn: async () => {},
};

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
      setState((prev) => {
        if ((prev[stepType] as string[]).includes(id)) return prev;
        return { ...prev, [stepType]: [...prev[stepType], id as any] };
      });
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: id, stepType }),
      });
    },
    [],
  );

  const markTourSeen = useCallback(
    async (pageId: string) => {
      setState((prev) => {
        if ((prev.tours as string[]).includes(pageId)) return prev;
        return { ...prev, tours: [...prev.tours, pageId as any] };
      });
      await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour: pageId }),
      });
    },
    [],
  );

  const shouldShowTour = useCallback(
    (pageId: string) => !isLoading && isAuthenticated && !state.tours.includes(pageId as any),
    [isLoading, isAuthenticated, state.tours],
  );

  const setSellerOptIn = useCallback(async () => {
    setState((prev) => ({ ...prev, sellerOptIn: true }));
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerOptIn: true }),
    });
  }, []);

  if (!enabled) {
    return (
      <OnboardingContext.Provider value={noopValue}>
        {children}
      </OnboardingContext.Provider>
    );
  }

  return (
    <OnboardingContext.Provider value={{ state, isLoading, completeStep, markTourSeen, shouldShowTour, setSellerOptIn }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
