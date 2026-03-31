
"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { OnboardingStep } from "../../types/types";

const STEPS = [
  { id: 1, label: "Profile" },
  { id: 2, label: "Kitchen" },
  { id: 3, label: "Verifications" },
  { id: 4, label: "Payments" },
];

interface Props {
  currentStep: OnboardingStep;
  // highest step reached — determines which steps are clickable
  maxStep: OnboardingStep;
  onStepClick: (step: OnboardingStep) => void;
}

export function OnboardingStepper({
  currentStep,
  maxStep,
  onStepClick,
}: Props) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 sm:gap-6 mb-0 flex-wrap">
        {/* Step label */}
        <span className="text-sm sm:text-base font-bold text-foreground whitespace-nowrap">
          Step {currentStep} out of 4
        </span>

        {/* Step pills */}
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          {STEPS.map((step) => {
            const done = step.id < currentStep;
            const active = step.id === currentStep;
            // A step is clickable if it has been reached before (maxStep)
            const clickable = step.id <= maxStep && step.id !== currentStep;

            return (
              <button
                key={step.id}
                type="button"
                disabled={!clickable}
                onClick={() =>
                  clickable && onStepClick(step.id as OnboardingStep)
                }
                className={`flex items-center gap-1.5 transition-all duration-200 ${
                  clickable
                    ? "cursor-pointer hover:opacity-70"
                    : "cursor-default"
                }`}
                title={clickable ? `Go back to ${step.label}` : undefined}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-[#007606] flex-shrink-0" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id}
                  </span>
                )}
                <span
                  className={`text-xs sm:text-sm font-semibold transition-colors ${
                    done
                      ? "text-[#007606]"
                      : active
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full h-[3px] bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={false}
          animate={{ width: `${(currentStep / 4) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
