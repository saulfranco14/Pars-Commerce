"use client";

import { useState } from "react";
import { MessageSquareReply } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";

import type { ReplySheetProps } from "@/features/growth/interfaces/lead";

const REPLY_MAX = 1000;

/** Paste what the prospect answered on WhatsApp; it also moves them to «Respondió». */
export function ReplySheet({ isOpen, businessName, busy, onClose, onSubmit }: ReplySheetProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!text.trim()) {
      setError("Pega o escribe lo que te contestó.");
      return;
    }
    if (await onSubmit(text.trim())) {
      setText("");
      onClose();
    }
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar lo que contestó"
      description={`Queda en la conversación de ${businessName} y pasa a «Respondió».`}
      icon={MessageSquareReply}
      footer={<button type="submit" form="reply-form" disabled={busy} className={`${adminActionButtonPrimary} w-full`}>{busy ? "Guardando…" : "Guardar su respuesta"}</button>}
    >
      <form id="reply-form" onSubmit={submit} className="grid gap-2" noValidate>
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          Su respuesta
          <textarea
            value={text}
            onChange={(event) => { setText(event.target.value); setError(null); }}
            rows={6}
            maxLength={REPLY_MAX}
            placeholder="Ejemplo: Buenas tardes, sí la vi. ¿Cuánto cuesta?"
            className="input-form min-h-36 w-full resize-y rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </label>
        {error ? <p className="text-xs text-red-500" role="alert">{error}</p> : <p className="text-xs text-muted-foreground">{text.length}/{REPLY_MAX}</p>}
      </form>
    </FormSheet>
  );
}
