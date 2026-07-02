"use client";

import React from "react";
import { computeCompleteness } from "@/lib/compute-profile-completeness";

interface ProfileCompletenessBarProps {
  imageUrl?: string;
  bio?: string;
  location?: string;
  bannerUrl?: string;
}

export function ProfileCompletenessBar({ imageUrl, bio, location, bannerUrl }: ProfileCompletenessBarProps) {
  const pct = computeCompleteness({ imageUrl, bio, location, bannerUrl });
  const isComplete = pct === 100;

  return (
    <div className={`border rounded-xl p-3 mb-4 ${isComplete ? "border-success bg-success-50" : "border-divider bg-content2"}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold">Profile completeness</span>
        <span className={`text-xs font-semibold ${isComplete ? "text-success" : "text-default-500"}`}>
          {pct}%{isComplete && " ✓"}
        </span>
      </div>
      <div className="w-full bg-default-100 rounded-full h-1.5 mb-1">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${pct >= 75 ? "bg-success" : "bg-warning"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!isComplete && (
        <p className="text-xs text-default-400">
          {pct < 50
            ? "Add a bio and location to strengthen your profile."
            : "Almost there — add a banner to complete your profile."}
        </p>
      )}
      {isComplete && (
        <p className="text-xs text-success">"Complete your profile" step marked done in your checklist.</p>
      )}
    </div>
  );
}
