"use client";

import { Copy } from "lucide-react";

import { useCopyText } from "@/features/growth/hooks/useCopyText";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { Notification } from "@/components/ui/Notification";
import { TlacoMascot } from "@/components/brand/TlacoMascot";

import type { TlacoAiAnswerProps } from "@/features/growth/interfaces/tlacoAi";

/** The one answer on screen: Tlaco IA thinking, then what it knows and where it comes from, ready to copy. */
export function TlacoAiAnswer({ answer, asking, error }: TlacoAiAnswerProps) {
  const { copied, copy } = useCopyText();
  if (error) return <Notification tone="error" title="No se pudo preguntar" message={error} />;
  if (!asking && !answer) return null;

  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border bg-surface p-3" aria-live="polite" aria-busy={Boolean(asking)}>
      <TlacoMascot size={36} thinking={Boolean(asking)} />
      {asking ? (
        <div className="grid gap-2 pt-1">
          <b className="text-sm text-foreground">{asking}</b>
          <span className="ai-line h-3 w-11/12 rounded-md" />
          <span className="ai-line h-3 w-3/4 rounded-md" />
        </div>
      ) : answer ? (
        <div className="grid min-w-0 gap-1.5">
          <b className="text-sm text-foreground">{answer.question}</b>
          <p className="text-sm leading-relaxed text-foreground">{answer.answer}</p>
          {answer.source ? (
            <>
              <span className="text-xs text-muted-foreground">De: {answer.source}</span>
              <button type="button" onClick={() => copy("answer", answer.answer)} className={`${adminActionButtonSecondary} mt-1 justify-self-start`}>
                <Copy className="h-4 w-4" aria-hidden />{copied === "answer" ? "Copiado" : "Copiar para WhatsApp"}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
