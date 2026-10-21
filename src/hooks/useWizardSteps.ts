"use client";

import { useEffect, useState } from "react";

/**
 * Step index plus the full-screen overlay behavior every wizard needs: the
 * page behind stays still and Escape closes it.
 */
export function useWizardSteps({ total, onClose }: { total: number; onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return {
    step,
    setStep,
    isFirstStep: step === 0,
    isLastStep: step === total - 1,
    goForward: () => setStep((current) => Math.min(current + 1, total - 1)),
    goBack: () => setStep((current) => Math.max(current - 1, 0)),
  };
}
