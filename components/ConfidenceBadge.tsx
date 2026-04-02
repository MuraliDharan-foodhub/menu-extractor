"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  if (confidence >= 0.8) {
    return (
      <Badge
        className={cn(
          "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
          className
        )}
      >
        {pct}% confidence
      </Badge>
    );
  }

  if (confidence >= 0.5) {
    return (
      <Badge
        className={cn(
          "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
          className
        )}
      >
        {pct}% confidence
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
        className
      )}
    >
      {pct}% confidence
    </Badge>
  );
}
