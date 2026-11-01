"use client";

import { useState } from "react";
import { MessageSquareReply } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";

import type { ReplySheetProps } from "@/features/growth/interfaces/lead";

const REPLY_MAX = 1000;

/** «Ya respondió»: moves them to «Respondió»; what they wrote is optional and lands in the history. */
export function ReplySheet({ isOpen, businessName, busy, onClose, onSubmit }: ReplySheetProps) {
  const [text, setText] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (await onSubmit(text.trim())) {
      setText("");
      onClose();
    }
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Ya respondió"
      description={`${businessName} pasa a «Respondió» y te sugerimos qué contestarle.`}
      icon={MessageSquareReply}
      footer={<button type="submit" form="reply-form" disabled={busy} className={`${adminActionButtonPrimary} w-full`}>{busy ? "Guardando…" : "Guardar"}</button>}
    >
      <form id="reply-form" onSubmit={submit} className="grid gap-2" noValidate>
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          Lo que te escribió (opcional)
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            maxLength={REPLY_MAX}
            placeholder="Ejemplo: Buenas tardes, sí la vi. ¿Cuánto cuesta?"
            className="input-form min-h-36 w-full resize-y rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <p className="text-xs text-muted-foreground">Si lo pegas, el equipo lo ve en el historial y la IA lo usa para tu respuesta. {text.length}/{REPLY_MAX}</p>
      </form>
    </FormSheet>
  );
}
