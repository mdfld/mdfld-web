"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/react";
import type { TourStep } from "@/types/onboarding";

interface SpotlightTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export function SpotlightTour({ steps, onComplete, onSkip }: SpotlightTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const current = steps[currentIndex];

  const measureTarget = useCallback(() => {
    const el = document.querySelector(current.selector);
    if (el) setTargetRect(el.getBoundingClientRect());
  }, [current.selector]);

  useEffect(() => {
    measureTarget();
    window.addEventListener("resize", measureTarget);
    return () => window.removeEventListener("resize", measureTarget);
  }, [measureTarget]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentIndex < steps.length - 1) setCurrentIndex((i) => i + 1);
        else onComplete();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, steps.length, onComplete, onSkip]);

  const PADDING = 8;
  const spotlightStyle = targetRect
    ? {
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
        borderRadius: 8,
      }
    : null;

  const tooltipStyle: React.CSSProperties = targetRect
    ? {
        position: "fixed",
        top: targetRect.bottom + PADDING + 12,
        left: Math.min(targetRect.left, window.innerWidth - 320),
        width: 300,
        zIndex: 10001,
      }
    : { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 300, zIndex: 10001 };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[9999]"
        onClick={onSkip}
        aria-hidden
      />
      {spotlightStyle && (
        <div
          className="fixed z-[10000] ring-2 ring-primary ring-offset-0 pointer-events-none"
          style={{ position: "fixed", ...spotlightStyle }}
        />
      )}
      <div
        className="bg-content1 border border-divider rounded-xl shadow-lg p-4 z-[10001]"
        style={tooltipStyle}
        role="dialog"
        aria-label={current.title}
      >
        <p className="text-xs text-default-500 mb-1">
          {currentIndex + 1} / {steps.length}
        </p>
        <h3 className="font-semibold text-sm mb-1">{current.title}</h3>
        <p className="text-sm text-default-600 mb-3">{current.body}</p>
        <div className="flex items-center justify-between gap-2">
          <Button size="sm" variant="light" onPress={onSkip}>
            Skip
          </Button>
          <div className="flex gap-2">
            {currentIndex > 0 && (
              <Button size="sm" variant="flat" onPress={() => setCurrentIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              color="primary"
              onPress={() => {
                if (currentIndex < steps.length - 1) setCurrentIndex((i) => i + 1);
                else onComplete();
              }}
            >
              {currentIndex < steps.length - 1 ? "Next" : "Done"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
