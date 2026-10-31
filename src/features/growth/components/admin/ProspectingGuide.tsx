"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CircleCheck, HelpCircle } from "lucide-react";

import { CollapsibleSection } from "@/components/admin/CollapsibleSection";
import { FilterTabs } from "@/components/ui/FilterTabs";

import { DAY_GUIDE, PIPELINE_GUIDE, PROSPECT_VIEWS, TEAM_RULES } from "@/features/growth/constants/leadPipeline";

const STORAGE_KEY = "tlaco_growth_guide_seen";

const TOPICS = [
  { value: "dia", label: "Tu día" },
  { value: "etapas", label: "Etapas" },
  { value: "vistas", label: "Pestañas" },
  { value: "reglas", label: "Reglas del equipo" },
];

function seen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function remember(open: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? "0" : "1");
  } catch {
    // Private mode: the guide just opens again next time.
  }
}

/** «Cómo funciona»: the day, the stages, the tabs and the team rules; open on the first visit, then on demand. */
export function ProspectingGuide() {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("dia");

  useEffect(() => {
    setOpen(!seen());
  }, []);

  function change(next: boolean) {
    setOpen(next);
    remember(next);
  }

  return (
    <CollapsibleSection
      icon={HelpCircle}
      tone="accent"
      title="¿Cómo funciona la prospección?"
      description="Qué hacer cada día, qué significa cada etapa y para qué sirve cada pestaña."
      open={open}
      onOpenChange={change}
    >
      <div className="grid gap-4">
        <FilterTabs tabs={TOPICS} activeValue={topic} onTabChange={setTopic} ariaLabel="Tema de la guía" />

        {topic === "dia" ? (
          <ol className="grid gap-3 md:grid-cols-3">
            {DAY_GUIDE.map((item, index) => (
              <li key={item.title} className="flex gap-3 rounded-xl border border-border-soft bg-surface p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{index + 1}</span>
                <span className="grid gap-0.5">
                  <span className="text-sm font-bold text-foreground">{item.title}</span>
                  <span className="text-xs leading-snug text-muted-foreground">{item.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        {topic === "etapas" ? (
          <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {PIPELINE_GUIDE.map((step, index) => (
              <li key={step.label} className="grid gap-1.5 rounded-xl border border-border-soft bg-surface p-3">
                <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">{index + 1}</span>
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground">{step.means}</span>
                <span className="text-xs text-foreground"><b className="font-semibold">Qué haces:</b> {step.todo}</span>
                <span className="inline-flex gap-1 text-xs text-muted-foreground"><ArrowRight className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />{step.moves}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {topic === "vistas" ? (
          <dl className="grid gap-2 sm:grid-cols-2">
            {PROSPECT_VIEWS.map((view) => (
              <div key={view.value} className="grid gap-0.5 rounded-xl border border-border-soft bg-surface p-3">
                <dt className="text-sm font-bold text-foreground">{view.label}</dt>
                <dd className="text-xs leading-snug text-muted-foreground">{view.hint}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {topic === "reglas" ? (
          <ul className="grid gap-2">
            {TEAM_RULES.map((rule) => (
              <li key={rule} className="flex gap-2 text-sm text-foreground">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{rule}
              </li>
            ))}
          </ul>
        ) : null}

        <button type="button" onClick={() => change(false)} className="w-fit text-sm font-semibold text-accent hover:underline">Entendido, ocultar la guía</button>
      </div>
    </CollapsibleSection>
  );
}
