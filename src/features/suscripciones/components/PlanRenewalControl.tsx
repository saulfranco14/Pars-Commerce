"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, RotateCcw } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";

import { setPlanRenewal } from "@/features/suscripciones/services/publicPlanClient";

import type { PlanRenewalControlProps } from "@/features/suscripciones/interfaces/planSubscription";

export function PlanRenewalControl({ token, cancelAtPeriodEnd, periodEndLabel }: PlanRenewalControlProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "cancel_period_end" | "resume") {
    setBusy(true);
    setError(null);
    try {
      await setPlanRenewal(token, action);
      setConfirming(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar el cambio. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <Notification tone="error" message={error} /> : null}
      {cancelAtPeriodEnd ? (
        <button
          type="button"
          onClick={() => void run("resume")}
          disabled={busy}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Seguir con mi suscripción
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-border-soft"
        >
          <CalendarX2 className="h-4 w-4" aria-hidden />
          Cancelar al terminar este periodo
        </button>
      )}
      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => run("cancel_period_end")}
        title="¿Cancelar tu suscripción?"
        description={`Lo que ya pagaste se respeta${periodEndLabel ? ` hasta el ${periodEndLabel}` : ""}. Después ya no se generarán más cobros.`}
        confirmLabel="Sí, cancelar"
        cancelLabel="Mantenerla"
        variant="danger"
        icon={CalendarX2}
        loading={busy}
      />
    </div>
  );
}
