"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/auth/safeNextPath";
import { useState } from "react";
import useSWR from "swr";
import {
  ArrowUpRight,
  Coins,
  CreditCard,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { Notification } from "@/components/ui/Notification";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { formatCurrency } from "@/features/qr/helpers/format";
import { useStudioContext } from "./StudioProvider";
import { useStudioBilling } from "../hooks/useStudioBilling";
import { loadCreditHistory } from "../services/studioClientService";
import { StudioLoading } from "./StudioLoading";

const REASONS: Record<string, string> = {
  subscription_grant: "Tlacos mensuales",
  purchase: "Recarga",
  hold: "Reserva para IA",
  capture: "Generación completada",
  release: "Reserva liberada",
  expiry: "Vencimiento",
  refund: "Reembolso",
  adjustment: "Ajuste auditado",
};
export function StudioBillingPage() {
  const {
      tenantId,
      tenantSlug,
      summary,
      isLoading,
      refresh,
      error: summaryError,
    } = useStudioContext(),
    billing = useStudioBilling(),
    [cancelOpen, setCancelOpen] = useState(false),
    [packCode, setPackCode] = useState<string | null>(null),
    [planCode, setPlanCode] = useState<string | null>(null);
  const query = useSearchParams(),
    returnTo = safeNextPath(query.get("return_to")),
    returnToDesign = returnTo.startsWith(
      `/dashboard/${encodeURIComponent(tenantSlug)}/studio/disenos/`,
    )
      ? returnTo
      : null;
  const canManage = summary?.permissions.includes("studio.manage");
  const history = useSWR(canManage ? ["studio-credits", tenantId] : null, () =>
    loadCreditHistory(tenantId),
  );
  if (isLoading) return <StudioLoading />;
  if (summaryError || !summary)
    return (
      <Notification
        tone="error"
        message={summaryError?.message ?? "No pudimos cargar la membresía."}
      />
    );
  const sub = summary.membership,
    pack = summary.packs.find((p) => p.code === packCode),
    plan = summary.plans.find((p) => p.code === planCode);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Membresía y Tlacos"
        description="Studio se contrata para este negocio y conserva separados los Tlacos mensuales y tus recargas."
        action={
          <button
            className={adminActionButtonSecondary}
            onClick={() => {
              void refresh();
              void history.mutate();
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        }
      />
      {returnToDesign && (
        <Link href={returnToDesign} className={adminActionButtonSecondary}>
          <ArrowUpRight className="h-4 w-4" />
          Volver a mi diseño
        </Link>
      )}
      {summary.membership?.ai_blocked && (
        <Notification
          tone="warning"
          message="Hay un pago en revisión. Tu saldo e historial se conservan; las generaciones están pausadas hasta resolverlo."
        />
      )}
      {billing.error && <Notification tone="error" message={billing.error} />}
      {billing.message && (
        <Notification tone="success" message={billing.message} />
      )}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-semibold text-muted-foreground">
          {sub
            ? (summary.plans.find((p) => p.code === sub.plan_code)?.name ??
              "Studio")
            : "Sin membresía Studio"}
        </p>
        <h2 className="mt-2 text-2xl font-bold">
          {summary.active
            ? sub?.cancel_at_period_end
              ? "Activa hasta terminar tu periodo"
              : "Membresía activa"
            : sub?.status === "pending_payment"
              ? "Pago pendiente de confirmación"
              : "Activa Studio para crear"}
        </h2>
        {sub?.current_period_end && (
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.active
              ? sub.cancel_at_period_end
                ? "Acceso hasta"
                : "Próxima renovación"
              : "Último periodo hasta"}
            : {new Date(sub.current_period_end).toLocaleDateString("es-MX")}
          </p>
        )}
        {sub?.pending_plan_code && (
          <p className="mt-2 text-sm text-accent">
            {sub.plan_change_status === "pending"
              ? "Confirmando cambio a"
              : "Cambio programado a"}{" "}
            {summary.plans.find((p) => p.code === sub.pending_plan_code)?.name}{" "}
            en la siguiente renovación.
          </p>
        )}
        {sub && !sub.cancel_at_period_end && sub.status !== "cancelled" && (
          <p className="mt-2 text-sm text-muted-foreground">
            {sub.plan_change_status === "pending"
              ? "Importe solicitado para la próxima renovación"
              : "Siguiente importe"}
            :{" "}
            {formatCurrency(
              sub.pending_amount_mxn ??
                sub.contracted_amount_mxn ??
                summary.plans.find((p) => p.code === sub.plan_code)
                  ?.amount_mxn ??
                0,
            )}{" "}
            MXN, IVA incluido.
          </p>
        )}
        {!summary.active &&
          sub &&
          !sub.cancel_at_period_end &&
          !["cancelled", "pending_payment"].includes(sub.status) && (
            <Notification
              tone="info"
              className="mt-3"
              message="Tu periodo terminó y la renovación aún no se confirma. Puedes esperar la verificación del cobro o cancelar la renovación antes de contratar de nuevo. No se creará otra suscripción mientras exista este contrato."
            />
          )}
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Al vencer, conservas la biblioteca, tus descargas y las publicaciones
          que sigan vigentes. Crear, editar, generar y aplicar nuevos diseños
          requiere reactivar.
        </p>
        {summary.owner &&
          sub &&
          sub.status !== "cancelled" &&
          !sub.cancel_at_period_end && (
            <button
              className={`${adminActionButtonSecondary} mt-4`}
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="h-4 w-4" />
              Cancelar renovación
            </button>
          )}
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Mensuales disponibles", value: summary.balance.monthly },
          { label: "Comprados disponibles", value: summary.balance.purchased },
          { label: "Reservados en trabajos", value: summary.balance.reserved },
        ].map((row) => (
          <div
            key={row.label}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <p className="text-xs text-muted-foreground">{row.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{row.value}</p>
          </div>
        ))}
      </section>
      {summary.balance.expiresAt && (
        <p className="text-sm text-muted-foreground">
          El saldo mensual disponible vence el{" "}
          {new Date(summary.balance.expiresAt).toLocaleDateString("es-MX")}.
        </p>
      )}
      <section>
        <h2 className="text-lg font-bold">Elige tu membresía</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {summary.plans.map((p) => (
            <article
              key={p.code}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <h3 className="font-bold">{p.name}</h3>
              <p className="mt-3 text-3xl font-bold">
                {formatCurrency(p.amount_mxn)}
                <span className="text-sm font-medium"> / mes</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                IVA incluido · {p.monthly_tlacos} Tlacos mensuales
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Editor y exportaciones incluidos. IA económica: 1 Tlaco;
                premium: 2 Tlacos.
              </p>
              <button
                disabled={
                  billing.busy ||
                  !summary.owner ||
                  !summary.checkoutEnabled ||
                  (summary.active && sub?.plan_code === p.code)
                }
                onClick={() => setPlanCode(p.code)}
                className={`${adminActionButtonPrimary} mt-4`}
              >
                <ArrowUpRight className="h-4 w-4" />
                {summary.active
                  ? sub?.plan_code === p.code
                    ? "Plan actual"
                    : "Cambiar al renovar"
                  : "Contratar"}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-bold">Recarga cuando lo necesites</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Compra única. Se consume después del saldo mensual y se conserva al
          vencer Studio.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {summary.packs.map((p) => (
            <article
              key={p.code}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <Coins className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-bold">{p.tlacos} Tlacos</h3>
              <p className="mt-1 text-lg font-bold">
                {formatCurrency(p.amount_mxn)}
              </p>
              <p className="text-xs text-muted-foreground">
                IVA incluido · pago único
              </p>
              <button
                className={`${adminActionButtonSecondary} mt-4`}
                disabled={
                  !summary.active ||
                  !canManage ||
                  !summary.checkoutEnabled ||
                  billing.busy
                }
                onClick={() => setPackCode(p.code)}
              >
                <CreditCard className="h-4 w-4" />
                Comprar recarga
              </button>
            </article>
          ))}
        </div>
      </section>
      {!summary.checkoutEnabled && (
        <Notification
          tone="info"
          message="El checkout todavía no está habilitado. No se acreditan Tlacos ni se activa Studio desde una URL de retorno."
        />
      )}
      {canManage && (
        <section>
          <h2 className="text-lg font-bold">Movimientos</h2>
          {history.error && (
            <Notification
              tone="error"
              message="No pudimos cargar el historial."
            />
          )}
          <div className="mt-3 divide-y divide-border-soft rounded-2xl border border-border bg-surface">
            {history.data?.ledger.length ? (
              history.data.ledger.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 p-4 text-sm"
                >
                  <div>
                    <p className="font-semibold">
                      {REASONS[row.reason] ?? row.reason}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(row.created_at).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <p className="font-bold tabular-nums">
                    {row.delta > 0 ? "+" : ""}
                    {row.delta} Tlacos
                    {row.reserved_delta !== 0 ? (
                      <span className="block text-xs font-medium text-muted-foreground">
                        Reserva {row.reserved_delta > 0 ? "+" : ""}
                        {row.reserved_delta}
                      </span>
                    ) : null}
                  </p>
                </div>
              ))
            ) : (
              <p className="p-5 text-sm text-muted-foreground">
                Aún no hay movimientos.
              </p>
            )}
          </div>
          {history.data?.orders
            .filter((o) => o.status !== "approved")
            .map((order) => (
              <p key={order.id} className="mt-2 text-sm text-muted-foreground">
                Recarga de {order.tlacos} Tlacos:{" "}
                {order.status === "pending" ? "pago pendiente" : order.status}.
                Tu saldo cambia cuando el pago se verifica.
              </p>
            ))}
        </section>
      )}
      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Detener la renovación de Studio"
        description="Conservas tu periodo pagado, diseños y recargas. No se realizarán futuras renovaciones de esta membresía."
        confirmLabel="Cancelar renovación"
        loading={billing.busy}
        onConfirm={async () => {
          await billing.cancel();
          setCancelOpen(false);
        }}
      />
      <ConfirmDialog
        isOpen={Boolean(pack)}
        onClose={() => setPackCode(null)}
        title={`Comprar ${pack?.tlacos ?? 0} Tlacos`}
        description={`Pagarás ${formatCurrency(pack?.amount_mxn ?? 0)}, IVA incluido, una sola vez. El saldo se acredita después de verificar el pago.`}
        confirmLabel="Ir a pagar"
        loading={billing.busy}
        onConfirm={async () => {
          if (pack) await billing.pack(pack.code);
        }}
      />
      <ConfirmDialog
        isOpen={Boolean(plan)}
        onClose={() => setPlanCode(null)}
        title={
          summary.active
            ? "Cambiar en la siguiente renovación"
            : "Contratar Studio"
        }
        description={
          summary.active
            ? `${plan?.name}: ${formatCurrency(plan?.amount_mxn ?? 0)} al mes. No cambia tu periodo actual ni agrega Tlacos hoy.`
            : `${plan?.name}: ${formatCurrency(plan?.amount_mxn ?? 0)} al mes, IVA incluido. Renovación automática hasta cancelar. Requiere pago confirmado.`
        }
        confirmLabel={summary.active ? "Programar cambio" : "Ir a pagar"}
        loading={billing.busy}
        onConfirm={async () => {
          if (plan) {
            if (summary.active) {
              await billing.change(plan.code);
              setPlanCode(null);
            } else await billing.subscribe(plan.code);
          }
        }}
      />
    </div>
  );
}
