"use client";

import { Copy, MessageCircle, Sparkles, X } from "lucide-react";

import { useCopyText } from "@/features/growth/hooks/useCopyText";
import { adminActionButtonAi, adminActionButtonIcon, adminActionButtonPrimary, adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { TlacoMascot } from "@/components/brand/TlacoMascot";
import { FormSheet } from "@/components/ui/FormSheet";
import { TlacoAiAskTab } from "@/features/growth/components/admin/TlacoAiAskTab";
import { TlacoAiTodayTab } from "@/features/growth/components/admin/TlacoAiTodayTab";
import { TlacoAiTourTab } from "@/features/growth/components/admin/TlacoAiTourTab";

import { buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { TLACO_AI_TOPICS, TOUR_VIDEO_PATH } from "@/features/growth/constants/tlacoAi";

import type { TlacoAiSheetProps } from "@/features/growth/interfaces/tlacoAi";

const tourUrl = () => `${window.location.origin}${TOUR_VIDEO_PATH}`;

/** Tlaco IA's own space: one tab per topic (today's plan, questions to activate, the video), more topics later. */
export function TlacoAiSheet({ isOpen, isTlaco, withToday, topic, onTopic, onClose, plan, text, writing, onAgain, onStep }: TlacoAiSheetProps) {
  const { copied, copy } = useCopyText();
  const next = plan?.steps.find((step) => step.when === null);
  const topics = TLACO_AI_TOPICS.filter((option) => (isTlaco || !option.tlacoOnly) && (withToday || option.value !== "hoy"));

  const footer =
    topic === "hoy" ? (
      <div className="grid grid-cols-2 gap-2">
        {next ? (
          <button type="button" onClick={() => onStep(next.action)} className={`${adminActionButtonPrimary} min-w-0 px-3`}><span className="truncate">{next.button}</span></button>
        ) : (
          <button type="button" onClick={onClose} className={`${adminActionButtonPrimary} min-w-0 px-3`}>Listo</button>
        )}
        <button type="button" onClick={onAgain} disabled={writing} className={`${adminActionButtonAi} min-w-0 px-3 ${writing ? "ai-busy" : ""}`}>
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">Otra sugerencia</span>
        </button>
      </div>
    ) : topic === "tour" ? (
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => window.open(buildWaLink("", `Le comparto un video corto de cómo funciona Tlaco: ${tourUrl()}`), "_blank", "noopener")}
          className={`${adminActionButtonPrimary} min-w-0 px-3`}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">Mandar por WhatsApp</span>
        </button>
        <button type="button" onClick={() => copy("tour", tourUrl())} className={`${adminActionButtonText} min-w-0`}>
          <Copy className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">{copied === "tour" ? "Copiado" : "Copiar enlace"}</span>
        </button>
      </div>
    ) : undefined;

  return (
    <FormSheet isOpen={isOpen} onClose={onClose} title="Tlaco IA" hideHeader footer={footer}>
      <div className="sticky top-0 z-10 -mx-5 grid gap-3 bg-surface px-5 pb-3 pt-3 md:-mx-6 md:px-6 md:pt-6">
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3">
          <TlacoMascot size={40} thinking={writing} />
          <div className="min-w-0">
            <h2 id="form-sheet-title" className="text-base font-bold text-foreground md:text-lg">Tlaco IA</h2>
            <p className="truncate text-xs text-muted-foreground md:text-sm">Te digo qué hacer y te lo enseño</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={adminActionButtonIcon}><X className="h-4.5 w-4.5" aria-hidden /></button>
        </div>
        {topics.length > 1 ? (
        <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-border-soft/70 p-1" role="tablist" aria-label="Temas de Tlaco IA">
          {topics.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={topic === option.value}
              onClick={() => onTopic(option.value)}
              className={`min-h-10 cursor-pointer truncate rounded-lg px-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                topic === option.value ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        ) : null}
      </div>
      <div className="pt-1" role="tabpanel">
        {topic === "hoy" ? <TlacoAiTodayTab plan={plan} text={text} writing={writing} onStep={onStep} /> : null}
        {topic === "activar" ? <TlacoAiAskTab /> : null}
        {topic === "tour" ? <TlacoAiTourTab /> : null}
      </div>
    </FormSheet>
  );
}
