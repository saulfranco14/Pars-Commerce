"use client";
import { Coins, RefreshCw } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { useStudioPlatform } from "../hooks/useStudioPlatform";
import { StudioLoading } from "./StudioLoading";

export function StudioPlatformPage() {
  const {
    data,
    isLoading,
    error,
    mutate,
    form,
    resolutionForm,
    reviewResolved,
    reconciling,
    reconcileError,
    reconciled,
    reconcile,
  } = useStudioPlatform();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Operación de Tlaco Studio"
        description="Supervisión de membresías, cobros, reservas y trabajos de imagen."
        action={
          <button
            className={adminActionButtonSecondary}
            onClick={() => void mutate()}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        }
      />
      <Link
        href="/dashboard/plataforma/studio/pruebas"
        className={adminActionButtonPrimary}
      >
        Probar editor de Studio
      </Link>
      {error && (
        <Notification
          tone="error"
          message="No tienes acceso o Studio aún no está configurado."
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={adminActionButtonSecondary}
          disabled={reconciling}
          onClick={() => void reconcile()}
        >
          <RefreshCw className="h-4 w-4" />
          {reconciling ? "Conciliando…" : "Conciliar pagos y trabajos"}
        </button>
        <p className="text-xs text-muted-foreground">
          Revisa operaciones existentes; no crea contrataciones ni generaciones.
        </p>
      </div>
      {reconcileError && <Notification tone="error" message={reconcileError} />}
      {reconciled && (
        <Notification
          tone="success"
          message="Turno de conciliación completado. Los pendientes restantes continúan por lotes."
        />
      )}
      {isLoading ? (
        <StudioLoading />
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Membresías recientes", value: data.memberships.length },
              {
                label: "Jobs en curso",
                value: data.jobs.filter((j) =>
                  ["queued", "processing"].includes(j.status),
                ).length,
              },
              { label: "Eventos fallidos", value: data.events.length },
              { label: "Reservas vigentes", value: data.reservations.length },
            ].map((row) => (
              <div
                className="rounded-2xl border border-border bg-surface p-4"
                key={row.label}
              >
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="mt-2 text-3xl font-bold">{row.value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Presupuesto diario: USD {data.limits.daily_budget_usd}. Presupuesto
            mensual por negocio: USD {data.limits.tenant_monthly_budget_usd}.
            Costos estimados de intentos registrados hoy: USD{" "}
            {data.attempts
              .reduce((sum, a) => sum + Number(a.estimated_cost_usd), 0)
              .toFixed(4)}
            . La lista operativa está limitada a los registros más recientes.
          </p>
          {[
            {
              title: "Membresías",
              rows: data.memberships.map(
                (m) =>
                  `${m.tenant_id} · ${m.plan_code} · ${m.status}${m.ai_blocked ? " · IA bloqueada" : ""}`,
              ),
            },
            {
              title: "Trabajos",
              rows: data.jobs.map(
                (j) => `${j.id} · ${j.status} · ${j.error_code ?? "sin error"}`,
              ),
            },
            {
              title: "Pagos",
              rows: data.payments.map(
                (p) =>
                  `${p.tenant_id} · $${p.amount_mxn} MXN · ${p.status}${p.refunded_mxn ? ` · reembolso $${p.refunded_mxn}` : ""}`,
              ),
            },
            {
              title: "Errores de webhook",
              rows: data.events.map(
                (e) =>
                  `${e.resource_type} · ${e.status} · ${e.error_code ?? "pendiente"}`,
              ),
            },
          ].map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <h2 className="font-bold">{section.title}</h2>
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto break-all text-xs text-muted-foreground">
                {section.rows.length ? (
                  section.rows.map((row, i) => <li key={i}>{row}</li>)
                ) : (
                  <li>Sin registros.</li>
                )}
              </ul>
            </section>
          ))}
          <form
            onSubmit={form.handleSubmit(form.submit)}
            className="max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-5"
          >
            <h2 className="font-bold">Ajuste de cortesía auditado</h2>
            <p className="text-xs leading-6 text-muted-foreground">
              Agrega de 1 a 500 Tlacos a un negocio con un motivo registrado.
              Las reversiones de pagos se procesan mediante conciliación.
            </p>
            <FormInput
              label="ID del negocio"
              {...form.register("tenant_id")}
              error={form.errors.tenant_id?.message}
            />
            <FormInput
              label="Cantidad de Tlacos"
              type="number"
              {...form.register("amount", { valueAsNumber: true })}
              error={form.errors.amount?.message}
            />
            <FormInput
              label="Motivo obligatorio"
              {...form.register("reason")}
              error={form.errors.reason?.message}
            />
            {form.submitError && (
              <Notification tone="error" message={form.submitError} />
            )}
            <button
              className={adminActionButtonPrimary}
              disabled={form.submitting}
            >
              <Coins className="h-4 w-4" />
              {form.submitting ? "Registrando…" : "Registrar ajuste"}
            </button>
          </form>
          <form
            onSubmit={resolutionForm.handleSubmit(resolutionForm.submit)}
            className="max-w-xl space-y-4 rounded-2xl border border-border bg-surface p-5"
          >
            <h2 className="font-bold">Resolver una revisión de pago</h2>
            <p className="text-xs leading-6 text-muted-foreground">
              Confirma que revisaste pago, consumo y devoluciones. La resolución
              permite nuevas generaciones sin cambiar saldos ni borrar
              evidencia.
            </p>
            <FormInput
              label="ID del negocio"
              {...resolutionForm.register("tenant_id")}
              error={resolutionForm.errors.tenant_id?.message}
            />
            <FormInput
              label="Motivo y decisión de soporte"
              {...resolutionForm.register("reason")}
              error={resolutionForm.errors.reason?.message}
            />
            {resolutionForm.submitError && (
              <Notification tone="error" message={resolutionForm.submitError} />
            )}
            {reviewResolved && (
              <Notification
                tone="success"
                message="Resolución registrada con su motivo."
              />
            )}
            <button
              className={adminActionButtonSecondary}
              disabled={resolutionForm.submitting}
            >
              <RefreshCw className="h-4 w-4" />
              Registrar resolución
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
