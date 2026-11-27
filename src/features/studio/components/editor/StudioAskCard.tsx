"use client";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import type { StudioAskCardProps } from "../../interfaces/ui";

/** Asked once: with what the item includes, the AI writes a phrase that sells. */
export function StudioAskCard({
  name,
  saving,
  onSave,
  onSkip,
}: StudioAskCardProps) {
  const [text, setText] = useState(""),
    ready = text.trim().length >= 2;
  return (
    <Notification
      tone="info"
      title={`¿Qué incluye ${name}?`}
      message={
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onSave(text.trim());
          }}
        >
          <p>
            Con eso la IA escribe una frase que sí vende. Se guarda en tu
            catálogo.
          </p>
          <FormInput
            label="Qué incluye"
            placeholder="Ej. lavado por fuera, por dentro y aspirado"
            maxLength={500}
            value={text}
            disabled={saving}
            onChange={(e) => setText(e.target.value)}
          />
          <div className={actionPair}>
            <button
              type="button"
              className={adminActionButtonSecondary}
              disabled={saving}
              onClick={onSkip}
            >
              <X className="h-4 w-4" />
              Saltar
            </button>
            <button
              type="submit"
              className={adminActionButtonPrimary}
              disabled={saving || !ready}
            >
              <Check className="h-4 w-4" />
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      }
    />
  );
}
