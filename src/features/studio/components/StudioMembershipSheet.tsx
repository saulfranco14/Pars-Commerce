"use client";
import { useSearchParams } from "next/navigation";
import { Check, CreditCard, X, WandSparkles } from "lucide-react";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { formatCurrency } from "@/features/qr/helpers/format";
import { useStudioBilling } from "../hooks/useStudioBilling";
import { useStudioContext } from "./StudioProvider";

export function StudioMembershipSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const considered = useSearchParams().get("studio_plan");
  const { summary } = useStudioContext(),
    billing = useStudioBilling();
  return (
    <FormSheet
      isOpen={open}
      onClose={onClose}
      title="Descarga y comparte sin límite"
      icon={WandSparkles}
      description="Diseñar, descargar y compartir es gratis. Con la membresía recibes Tlacos cada mes para la IA y publicas en tu sitio."
      maxWidth="max-w-3xl"
      footer={
        <button
          className={`${adminActionButtonSecondary} w-full sm:w-auto`}
          onClick={onClose}
          disabled={billing.busy}
        >
          <X className="h-4 w-4" />
          Volver
        </button>
      }
    >
      <div className="space-y-4 pb-2">
        {billing.error && <Notification tone="error" message={billing.error} />}
        {!summary?.checkoutEnabled && (
          <Notification
            tone="info"
            message="La contratación se habilitará cuando Studio y sus cobros estén configurados. No se realizará ningún cargo ahora."
          />
        )}
        {!summary?.owner && (
          <Notification
            tone="info"
            message="El propietario del negocio puede contratar Studio para que el equipo cree diseños."
          />
        )}
        <div className="grid gap-3 md:grid-cols-3">
          {summary?.plans.map((plan) => (
            <article
              key={plan.code}
              className={`flex flex-col rounded-2xl border bg-surface p-4 ${considered === plan.code ? "border-accent ring-1 ring-accent/20" : "border-border"}`}
            >
              {considered === plan.code && (
                <p className="mb-2 text-xs font-semibold text-accent">
                  Plan que consultaste
                </p>
              )}
              <h3 className="font-bold">{plan.name}</h3>
              <p className="mt-3 text-3xl font-bold tabular-nums">
                {formatCurrency(plan.amount_mxn)}
                <span className="text-xs font-medium text-muted-foreground">
                  {" "}
                  / mes
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Precio final con IVA incluido
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-accent" />
                {plan.monthly_tlacos} Tlacos mensuales
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Editor, plantillas, descargas y publicación interna incluidos.
              </p>
              <button
                disabled={
                  billing.busy || !summary.owner || !summary.checkoutEnabled
                }
                onClick={() => void billing.subscribe(plan.code)}
                className={`${adminActionButtonPrimary} mt-5 w-full`}
              >
                <CreditCard className="h-4 w-4" />
                {billing.busy ? "Preparando…" : "Contratar"}
              </button>
            </article>
          ))}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Renovación mensual automática. Puedes cancelar desde este panel y
          conservar tu periodo pagado. Los Tlacos mensuales vencen al terminar
          el periodo; las recargas se conservan. Studio se contrata por negocio
          y no cambia tu plan de operación Tlaco.
        </p>
      </div>
    </FormSheet>
  );
}
