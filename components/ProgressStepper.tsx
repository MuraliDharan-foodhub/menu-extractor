"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

const STEPS = [
  { key: "upload", label: "Upload" },
  { key: "extract", label: "Extract" },
  { key: "edit", label: "Edit" },
  { key: "review", label: "Review" },
  { key: "submit", label: "Submit" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

interface ProgressStepperProps {
  currentStep: StepKey;
}

const STEP_ORDER: StepKey[] = ["upload", "extract", "edit", "review", "submit"];

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted-foreground/30 bg-background text-muted-foreground/50"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1 text-xs font-medium",
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                        ? "text-primary/70"
                        : "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mb-4 h-0.5 w-12 sm:w-20",
                    index < currentIndex ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
