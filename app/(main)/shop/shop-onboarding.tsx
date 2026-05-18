"use client";

import { useEffect } from "react";
import { useOnboarding } from "@/contexts/onboarding-context";

export function ShopOnboarding() {
  const { completeStep } = useOnboarding();
  useEffect(() => {
    completeStep("browse-shop", "buyer");
  }, [completeStep]);
  return null;
}
