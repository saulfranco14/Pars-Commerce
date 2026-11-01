"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";

import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useTlacoAiPlacement } from "@/features/growth/hooks/useTlacoAiPlacement";
import { useTodayPlan } from "@/features/growth/hooks/useTodayPlan";
import { useTypewriter } from "@/features/growth/hooks/useTypewriter";
import { adminActionButtonAi, adminActionButtonIcon, adminActionButtonPrimary, adminActionButtonSecondary, adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { TlacoMascot } from "@/components/brand/TlacoMascot";
import { TlacoAiFab } from "@/features/growth/components/admin/TlacoAiFab";
import { TlacoAiSheet } from "@/features/growth/components/admin/TlacoAiSheet";
import { TlacoAiTag } from "@/features/growth/components/admin/TlacoAiTag";

import type { TlacoAiCardProps, TlacoAiTopic, TodayStepAction } from "@/features/growth/interfaces/tlacoAi";

const LINE_WIDTHS = ["w-11/12", "w-4/5", "w-3/5"];

function nowLabel(): string {
  const parts = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "America/Mexico_City" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `Hoy, ${get("weekday")} ${get("day")} ${get("month").replace(".", "")} · ${get("hour")}:${get("minute")}`;
}

/**
 * Tlaco IA above «Tu día»: four lines at most of what to do today, the rest in its sheet. It floats once scrolled away;
 * «Entendido» leaves only the floating button and ✕ hides it for the day.
 */
export function TlacoAiCard({ facts, onStep }: TlacoAiCardProps) {
  const { plan, text, fresh, writing, again } = useTodayPlan(facts);
  const { actor } = useGrowthMe();
  const isTlaco = !actor?.tenantId;
  const { placement, float, hide } = useTlacoAiPlacement();
  const [topic, setTopic] = useState<TlacoAiTopic | null>(null);
  const [clamped, setClamped] = useState(false);
  const [inView, setInView] = useState(true);
  const textRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const { shown, done } = useTypewriter(text?.text ?? "", fresh && text?.source === "ai");
  const thinking = writing || !text;

  useLayoutEffect(() => {
    const box = textRef.current;
    if (!box || !done) return;
    setClamped(box.scrollHeight > box.clientHeight + 1);
  }, [done, shown]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(card);
    return () => observer.disconnect();
  }, [placement]);

  const step = (action: TodayStepAction) => {
    setTopic(null);
    onStep(action);
  };

  if (placement === "hidden") return null;
  const sheet = (
    <TlacoAiSheet
      isOpen={topic !== null}
      isTlaco={isTlaco}
      withToday
      topic={topic ?? "hoy"}
      onTopic={setTopic}
      onClose={() => setTopic(null)}
      plan={plan}
      text={text}
      writing={writing}
      onAgain={again}
      onStep={step}
    />
  );
  const fab = (
    <TlacoAiFab
      visible={topic === null && (placement === "floating" || !inView)}
      teaser={isTlaco ? "¿Dudas para activar? Pregúntame" : "Aquí está tu plan de hoy"}
      onOpen={() => setTopic(isTlaco ? "activar" : "hoy")}
    />
  );
  if (placement === "floating") return <>{fab}{sheet}</>;

  return (
    <section ref={cardRef} className="grid gap-2.5 rounded-2xl border border-accent/30 bg-linear-to-b from-accent/10 to-surface to-60% p-3.5" aria-label="Tlaco IA" aria-busy={thinking}>
      <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-2.5">
        <TlacoMascot size={44} thinking={thinking} />
        <div className="grid min-w-0 justify-items-start gap-0.5">
          <TlacoAiTag />
          <span className="truncate text-xs text-muted-foreground first-letter:uppercase">{nowLabel()}</span>
        </div>
        <button type="button" onClick={hide} aria-label="Ocultar Tlaco IA por hoy" title="Ocultar por hoy" className={`${adminActionButtonIcon} -mr-1 -mt-1 self-start border-transparent bg-transparent`}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {thinking ? (
        <div className="grid min-h-24 content-start gap-2.5 pt-1" aria-label="Tlaco IA está pensando">
          {LINE_WIDTHS.map((width) => <span key={width} className={`ai-line h-3 rounded-md ${width}`} />)}
        </div>
      ) : (
        <p ref={textRef} className="relative max-h-24 overflow-hidden text-sm leading-6 text-foreground" aria-live="polite">
          {shown}
          {clamped ? <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-b from-transparent to-surface" aria-hidden /> : null}
        </p>
      )}
      {clamped && !thinking ? (
        <button type="button" onClick={() => setTopic("hoy")} className={`${adminActionButtonText} -mt-2 min-h-9 justify-self-start px-1`}>Ver todo</button>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={float} className={`${adminActionButtonPrimary} min-w-0 px-3`}>
          <Check className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">Entendido</span>
        </button>
        {isTlaco ? (
          <button type="button" onClick={() => setTopic("activar")} className={`${adminActionButtonAi} min-w-0 px-3`}>
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">Pregúntale</span>
          </button>
        ) : (
          <button type="button" onClick={() => setTopic("hoy")} disabled={!plan} className={`${adminActionButtonSecondary} min-w-0 px-3`}><span className="truncate">Ver el plan</span></button>
        )}
      </div>
      {sheet}
      {fab}
    </section>
  );
}
