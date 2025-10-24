"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";

interface StarRatingDisplayProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  maxRating = 5,
  size = "md",
  className,
}) => {
  const starWidth = React.useMemo(() => {
    switch (size) {
      case "sm":
        return 16;
      case "md":
        return 24;
      case "lg":
        return 32;
    }
  }, [size]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }, (_, index) => (
        <Icon
          key={index}
          icon="solar:star-bold"
          width={starWidth}
          className={cn(
            "transition-colors pointer-events-none",
            index < rating ? "text-primary" : "text-default-200",
          )}
        />
      ))}
    </div>
  );
};

export default StarRatingDisplay;
