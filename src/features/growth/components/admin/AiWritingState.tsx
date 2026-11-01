"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { AI_STEP_MS, AI_WRITING_STEPS } from "@/features/growth/constants/aiWriting";

const LINE_WIDTHS = ["w-11/12", "w-4/5", "w-full", "w-3/5", "w-2/3"];

/** Placeholder for the message while the AI writes: what it is doing now and shimmering lines where the text will go. */
export function AiWritingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setStep((current) => Math.min(current + 1, AI_WRITING_STEPS.length - 1)), AI_STEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="grid min-h-48 content-start gap-3 rounded-xl border border-border-soft bg-surface-raised p-3" aria-busy="true" aria-live="polite">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
        <Sparkles className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
        {AI_WRITING_STEPS[step]}
      </p>
      <div className="grid gap-2.5 pt-1" aria-hidden>
        {LINE_WIDTHS.map((width) => <span key={width} className={`ai-line h-3 rounded-md ${width}`} />)}
      </div>
    </div>
  );
}
