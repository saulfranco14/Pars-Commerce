"use client";

import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { StepDots } from "@/components/wizard/StepDots";

import type { ReactNode } from "react";

interface WizardShellProps {
  titleId: string;
  step: number;
  total: number;
  canContinue: boolean;
  nextLabel: string;
  backLabel: string;
  closeLabel: string;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  /** Brand or context shown at the top left. */
  header: ReactNode;
  children: ReactNode;
}

/** Full-screen guided flow: brand bar, one step at a time, sticky back/progress/next footer. */
export function WizardShell({
  titleId,
  step,
  total,
  canContinue,
  nextLabel,
  backLabel,
  closeLabel,
  onBack,
  onNext,
  onClose,
  header,
  children,
}: WizardShellProps) {
  return (
    <div
      className="fixed inset-0 z-80 overflow-y-auto bg-background text-foreground"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 pt-5 sm:px-8 sm:pt-7">
        <div className="flex items-center justify-between">
          {header}
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 items-start py-8 sm:items-center sm:py-12">
          <div key={step} className="animate-fade-in-up mx-auto w-full max-w-3xl sm:min-h-118">
            {children}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-5 border-t border-border bg-background/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {backLabel}
            </button>
            <StepDots current={step} total={total} />
            <button
              type="button"
              onClick={onNext}
              disabled={!canContinue}
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
