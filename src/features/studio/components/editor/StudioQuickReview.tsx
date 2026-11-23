"use client";
import { CircleAlert, CircleCheck, Wrench } from "lucide-react";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { reviewStudioScene } from "../../helpers/scene";
import type { StudioQuickReviewProps } from "../../interfaces/ui";

export function StudioQuickReview({
  scene,
  disabled,
  onFix,
}: StudioQuickReviewProps) {
  const findings = reviewStudioScene(scene),
    messages = [...new Set(findings.map((f) => f.message))],
    fixable = findings.some((f) => f.action);
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-bold">Revisión automática · 0 Tlacos</h2>
      {messages.length ? (
        <ul className="space-y-2 text-sm">
          {messages.map((message) => (
            <li key={message} className="flex gap-2">
              <CircleAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                aria-hidden
              />
              {message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm">
          <CircleCheck className="h-4 w-4 text-emerald-600" aria-hidden />
          Todo se lee bien y queda dentro del área segura.
        </p>
      )}
      {fixable && (
        <button
          type="button"
          className={`${adminActionButtonSecondary} w-full`}
          disabled={disabled}
          onClick={onFix}
        >
          <Wrench className="h-4 w-4" />
          Corregir
        </button>
      )}
    </section>
  );
}
