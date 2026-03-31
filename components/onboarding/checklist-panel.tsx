"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { BUYER_CHECKLIST, SELLER_CHECKLIST } from "@/types/onboarding";
import type { ChecklistStep } from "@/types/onboarding";

interface ChecklistPanelProps {
  type: "buyer" | "seller";
}

export function ChecklistPanel({ type }: ChecklistPanelProps) {
  const { state } = useOnboarding();
  const [collapsed, setCollapsed] = useState(false);

  const steps: ChecklistStep[] = type === "buyer" ? BUYER_CHECKLIST : SELLER_CHECKLIST;
  const completed = type === "buyer" ? state.buyer : state.seller;

  function isUnlocked(stepId: string): boolean {
    if (type === "buyer") return true;
    if (stepId === "org-name-bio" || stepId === "org-logo") return true;
    if (stepId === "payout-method" || stepId === "return-policy") {
      return completed.includes("org-name-bio" as any);
    }
    if (stepId === "list-product") {
      return completed.includes("payout-method" as any) && completed.includes("return-policy" as any);
    }
    return true;
  }

  const requiredSteps = steps.filter((s) => !s.optional);
  const requiredCompleted = requiredSteps.filter((s) => completed.includes(s.id as any));
  const allRequiredDone = requiredCompleted.length === requiredSteps.length;

  if (allRequiredDone) return null;

  const progress = Math.round((requiredCompleted.length / requiredSteps.length) * 100);

  return (
    <div
      className="bg-content1 border border-divider rounded-xl p-4 mb-6"
      data-onboarding="checklist-panel"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">
            {type === "buyer" ? "Get started on MDFLD" : "Set up your store"}
          </h3>
          <p className="text-xs text-default-500">
            {requiredCompleted.length} of {requiredSteps.length} steps complete
          </p>
        </div>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand checklist" : "Collapse checklist"}
        >
          <Icon icon={collapsed ? "lucide:chevron-down" : "lucide:chevron-up"} />
        </Button>
      </div>

      <div className="w-full bg-default-100 rounded-full h-1.5 mb-3">
        <div
          className="bg-primary h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!collapsed && (
        <ul className="space-y-2">
          {steps.map((step) => {
            const done = completed.includes(step.id as any);
            const unlocked = isUnlocked(step.id);
            return (
              <li
                key={step.id}
                className={`flex items-center gap-2 text-sm ${!unlocked ? "opacity-40" : ""}`}
              >
                <Icon
                  icon={done ? "lucide:check-circle" : unlocked ? "lucide:circle" : "lucide:lock"}
                  className={done ? "text-success" : "text-default-400"}
                  width={16}
                />
                <span className={done ? "line-through text-default-400" : ""}>
                  {step.label}
                  {step.optional && (
                    <span className="ml-1 text-xs text-default-400">(bonus)</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
