"use client";

import { useEffect, useState } from "react";
import { HelpCircle, X } from "lucide-react";

import { PIPELINE_GUIDE } from "@/features/growth/constants/leadPipeline";

const STORAGE_KEY = "tlaco_growth_guide_seen";

function seen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** First-visit explanation of the stages and what to do in each; it can be hidden and opened again. */
export function ProspectingGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!seen());
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode: the guide just shows again next time */
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
        <HelpCircle className="h-4 w-4" aria-hidden />¿Cómo funciona la prospección?
      </button>
    );
  }

  return (
    <section className="grid gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:p-5" aria-label="Cómo funciona">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Cómo funciona</h2>
          <p className="text-sm text-muted-foreground">Cada negocio avanza por estas etapas. Tu trabajo es moverlo a la siguiente.</p>
        </div>
        <button type="button" onClick={close} aria-label="Ocultar la guía" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-border-soft">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PIPELINE_GUIDE.map((step, index) => (
          <li key={step.label} className="grid gap-1">
            <span className="h-1 rounded-full bg-accent" style={{ opacity: 0.35 + (index / PIPELINE_GUIDE.length) * 0.65 }} aria-hidden />
            <span className="text-sm font-bold text-foreground">{index + 1}. {step.label}</span>
            <span className="text-xs text-muted-foreground">{step.todo}</span>
          </li>
        ))}
      </ol>
      <button type="button" onClick={close} className="w-fit text-sm font-semibold text-accent hover:underline">Entendido</button>
    </section>
  );
}
