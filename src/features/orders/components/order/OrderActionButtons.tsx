"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/features/orders/hooks/useOrder";
import {
  useActiveTenant,
  usePermission,
  useTenantStore,
} from "@/stores/useTenantStore";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";
import { ConfirmModal } from "@/components/ConfirmModal";
import { AssignBeforePaidModal } from "@/features/orders/components/payment/AssignBeforePaidModal";
import { ConfirmPaymentModal } from "@/features/orders/components/payment/ConfirmPaymentModal";
import {
  Zap,
  PlayCircle,
  CheckCircle,
  DollarSign,
  Smartphone,
  X,
  Banknote,
  ExternalLink,
  PackagePlus,
} from "lucide-react";
import { AddendumSheet } from "@/features/orders/components/order/AddendumSheet";
import type { OrderActionButtonsProps } from "@/features/orders/interfaces/orderActionButtons";
import { GenerateLinkModal } from "./GenerateLinkModal";
import { OrderCreditSheet } from "./OrderCreditSheet";
import { btnDanger as standardDanger, btnPrimary as standardPrimary, btnSecondary as standardSecondary } from "@/components/ui/buttonClasses";
import { WhatsAppShareButton } from "@/components/communications/WhatsAppShareButton";

function isExpressOrderEnabled(settings: unknown): boolean {
  if (!settings || typeof settings !== "object") return false;
  const s = settings as Record<string, unknown>;
  if (s.express_order_enabled !== undefined)
    return s.express_order_enabled === true;
  return s.express_orders === true;
}

export function OrderActionButtons({
  embedded,
  fixedBar,
}: OrderActionButtonsProps = {}) {
  const router = useRouter();
  const {
    order,
    team,
    tenantSlug,
    actionLoading,
    handleStatusChange,
    handleAssignAndMarkPaid,
    handleMarkAsPaidWithMethod,
    handleGeneratePaymentLink,
    handleExpressToPayment,
    fetchOrder,
    setError,
  } = useOrder();
  const activeTenant = useActiveTenant();
  const activeRole = useTenantStore((s) => s.activeRole)();
  const can = usePermission();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [addendumOpen, setAddendumOpen] = useState(false);
  const [assignBeforePaidModalOpen, setAssignBeforePaidModalOpen] =
    useState(false);
  const [confirmPaymentModalOpen, setConfirmPaymentModalOpen] = useState(false);
  const [generateLinkModalOpen, setGenerateLinkModalOpen] = useState(false);
  const [creditSheetOpen, setCreditSheetOpen] = useState(false);
  const [acceptRequestOpen, setAcceptRequestOpen] = useState(false);
  const [rejectRequestOpen, setRejectRequestOpen] = useState(false);
  const [completePickupOpen, setCompletePickupOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  if (!order) return null;
  const orderId = order.id;

  const items = order.items ?? [];
  const hasNoItems = items.length === 0;
  const canStartOrComplete = !hasNoItems;
  const expressEnabled = isExpressOrderEnabled(activeTenant?.settings);
  const isEditableStatus = ["draft", "assigned", "in_progress"].includes(
    order.status,
  );
  const showExpressButton =
    expressEnabled && isEditableStatus && canStartOrComplete;

  // Cancelar va por permiso: es lo que comprueba el PATCH de `/api/orders`, y
  // el `cashier` (el responsable de pedidos) también cierra.
  const showCancel =
    can(ORDER_PERMISSIONS.close) &&
    ["draft", "assigned", "in_progress", "pending_pickup", "paid"].includes(
      order.status,
    );

  // "Lo que faltó": solo sobre un pedido que el cliente YA cerró. Antes de eso
  // no hace falta un pedido aparte — se le agregan los ítems al que está
  // abierto, que es lo que hace el botón de agregar item.
  const showAddendumButton =
    can(ORDER_PERMISSIONS.addendum) &&
    ["paid", "completed"].includes(order.status);
  const showCompletePickup =
    Boolean(order.scheduled_for) &&
    order.status === "paid" &&
    !order.pickup_completed_at;

  // Los préstamos siguen siendo del dueño del negocio. No hay un permiso
  // `loans.*` en el sistema todavía, así que aquí sí se compara el rol; en
  // cuanto exista, esto debe pasar a `can(...)` como el resto.
  const isOwner = activeRole?.name === "owner";

  // Préstamo vinculado
  const existingLoan = (order as { loan?: { id: string; status: string } | null }).loan;
  const hasActiveLoan = existingLoan && existingLoan.status !== "cancelled";
  // Mostrar "Ver préstamo" si hay uno activo (cualquier status de orden)
  // Mostrar "Registrar como préstamo" solo si no tiene préstamo y la orden no está pagada/cancelada
  const showViewLoanButton = isOwner && !!hasActiveLoan;
  const showRegisterLoanButton = isOwner && !hasActiveLoan && order.status !== "cancelled" && order.status !== "paid";

  function handleGoToLoan() {
    if (existingLoan?.id) {
      router.push(`/dashboard/${tenantSlug}/prestamos/${existingLoan.id}`);
    }
  }

  function handleRegisterLoan() {
    if (!order) return;
    const concept = order.items
      ?.map((i) => i.product?.name)
      .filter(Boolean)
      .join(", ") || `Orden ${order.id.slice(0, 8)}`;
    const params = new URLSearchParams({
      order_id: order.id,
      amount: String(order.total),
      concept,
    });
    router.push(`/dashboard/${tenantSlug}/prestamos/nuevo?${params.toString()}`);
  }
  const needsAssignBeforePaid =
    order.status === "completed" ||
    order.status === "pending_payment" ||
    order.status === "pending_pickup";

  async function handleExpressClick() {
    if (!order) return;
    const wasUnassigned = !order.assigned_to;
    const ok = await handleExpressToPayment();
    if (ok) {
      if (wasUnassigned) {
        setAssignBeforePaidModalOpen(true);
      } else {
        setConfirmPaymentModalOpen(true);
      }
    }
  }

  function handlePayClick() {
    if (needsAssignBeforePaid) {
      setAssignBeforePaidModalOpen(true);
    } else {
      setConfirmPaymentModalOpen(true);
    }
  }

  async function resolvePublicRequest(action: "accept-request" | "reject-request") {
    setRequestLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/${action}`, {
        method: "POST",
        headers: action === "reject-request" ? { "Content-Type": "application/json" } : undefined,
        body: action === "reject-request" ? JSON.stringify({ reason: "El negocio no puede atender este pedido por ahora." }) : undefined,
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No pudimos actualizar la solicitud.");
      await fetchOrder();
      setAcceptRequestOpen(false);
      setRejectRequestOpen(false);
    } finally {
      setRequestLoading(false);
    }
  }

  async function completePickup() {
    setRequestLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/complete-pickup`, {
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "No pudimos confirmar la recolección.");
      }
      await fetchOrder();
      setCompletePickupOpen(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No pudimos confirmar la recolección.",
      );
    } finally {
      setRequestLoading(false);
    }
  }

  const btnPrimary = `${standardPrimary} min-h-12 rounded-xl px-4 py-3 font-semibold active:scale-[0.98]`;
  const btnSuccess = `${standardPrimary} min-h-12 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500 focus-visible:ring-emerald-500 active:scale-[0.98]`;
  const btnBlue = `${standardPrimary} min-h-12 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 focus-visible:ring-blue-500 active:scale-[0.98]`;
  const btnDestructive = `${standardDanger} min-h-12 rounded-xl bg-surface px-4 py-3 font-semibold active:scale-[0.98]`;
  const btnSecondary = `${standardSecondary} min-h-12 rounded-xl bg-surface px-4 py-3 font-semibold active:scale-[0.98]`;

  const actionContext = order.status === "pending_acceptance"
    ? { label: "Solicitud nueva", detail: "Elige si el negocio puede prepararla." }
    : order.status === "draft" || order.status === "assigned"
      ? { label: "Siguiente paso", detail: "Revisa el ticket y envíalo a preparación." }
      : order.status === "in_progress"
        ? { label: "Siguiente paso", detail: "Confirma cuando el pedido esté listo para cobrar." }
        : showCompletePickup
          ? { label: "Recolección programada", detail: "Confirma cuando el cliente ya se llevó su pedido." }
        : order.status === "completed"
          ? { label: "Cobrar orden", detail: "Elige cómo registrar el pago del cliente." }
          : { label: "Acciones de la orden", detail: "Selecciona la acción que necesitas." };

  const wrapperClass = embedded
    ? "w-full min-w-0 max-w-full overflow-hidden"
    : "w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-surface-raised p-4 shadow-sm";

  const flexClass = fixedBar
    ? "flex w-full min-w-0 max-w-full flex-col gap-3 overflow-hidden"
    : "flex w-full min-w-0 max-w-full flex-col-reverse gap-3 overflow-hidden sm:flex-row sm:flex-wrap sm:justify-end";

  return (
    <div className={wrapperClass}>
      {fixedBar && (
        <div className="mb-2 border-b border-border-soft pb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{actionContext.label}</p>
          <p className="mt-0.5 text-xs text-foreground">{actionContext.detail}</p>
        </div>
      )}
      <div className={flexClass}>
        {order.status === "pending_acceptance" && <>
          {!fixedBar && <button type="button" onClick={() => setRejectRequestOpen(true)} disabled={requestLoading} className={`w-full min-w-0 shrink-0 sm:w-auto ${btnDestructive}`}><X className="h-4 w-4" aria-hidden />Rechazar solicitud</button>}
          <button type="button" onClick={() => setAcceptRequestOpen(true)} disabled={requestLoading} className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}><CheckCircle className="h-4 w-4" aria-hidden />Aceptar para preparar</button>
        </>}
        {showExpressButton && (
          <button
            type="button"
            onClick={handleExpressClick}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
          >
            <Zap className="h-4 w-4 shrink-0" aria-hidden />
            Ir al cobro
          </button>
        )}
        {showCancel && !fixedBar && (
          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnDestructive}`}
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            Cancelar orden
          </button>
        )}
        {!showExpressButton && order.status === "draft" && (
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={actionLoading || !canStartOrComplete}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnPrimary}`}
            title={
              hasNoItems
                ? "Agrega al menos un producto o servicio para continuar"
                : undefined
            }
          >
            <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
            Pasar a preparación
          </button>
        )}
        {!showExpressButton && order.status === "assigned" && (
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={actionLoading || !canStartOrComplete}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnPrimary}`}
            title={
              hasNoItems
                ? "Agrega al menos un producto o servicio para continuar"
                : undefined
            }
          >
            <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
            Pasar a preparación
          </button>
        )}
        {!showExpressButton && order.status === "in_progress" && (
          <button
            type="button"
            onClick={() => handleStatusChange("completed")}
            disabled={actionLoading || !canStartOrComplete}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
            title={
              hasNoItems
                ? "La orden debe tener productos o servicios para continuar"
                : undefined
            }
          >
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
            Lista para cobro
          </button>
        )}
        {order.status === "completed" && (
          <>
            <button
              type="button"
              onClick={handlePayClick}
              disabled={actionLoading}
              className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
            >
              <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
              Cobro directo
            </button>
            {!fixedBar && <button
              type="button"
              onClick={() => setGenerateLinkModalOpen(true)}
              disabled={actionLoading}
              className={`w-full min-w-0 shrink-0 sm:w-auto ${btnBlue}`}
            >
              <Smartphone className="h-4 w-4 shrink-0" aria-hidden />
              Generar cobro (MercadoPago)
            </button>}
            {isOwner && !fixedBar && (
              <button
                type="button"
                onClick={() => setCreditSheetOpen(true)}
                disabled={actionLoading}
                className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSecondary}`}
              >
                <Banknote className="h-4 w-4 shrink-0" aria-hidden />
                Agregar a crédito
              </button>
            )}
          </>
        )}
        {(order.status === "pending_payment" ||
          order.status === "pending_pickup") && (
          <button
            type="button"
            onClick={handlePayClick}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
          >
            <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
            {order.status === "pending_pickup"
              ? "Marcar como cobrado (recogió)"
              : "Marcar como pagado"}
          </button>
        )}
        {showCompletePickup && (
          <button
            type="button"
            onClick={() => setCompletePickupOpen(true)}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSuccess}`}
          >
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
            Confirmar que ya recogió
          </button>
        )}
        {showViewLoanButton && !fixedBar && (
          <button
            type="button"
            onClick={handleGoToLoan}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSecondary}`}
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            Ver préstamo
          </button>
        )}
        {showRegisterLoanButton && !fixedBar && (
          <button
            type="button"
            onClick={handleRegisterLoan}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSecondary}`}
          >
            <Banknote className="h-4 w-4 shrink-0" aria-hidden />
            Registrar como préstamo
          </button>
        )}
        {showAddendumButton && !fixedBar && (
          <button
            type="button"
            onClick={() => setAddendumOpen(true)}
            disabled={actionLoading}
            className={`w-full min-w-0 shrink-0 sm:w-auto ${btnSecondary}`}
          >
            <PackagePlus className="h-4 w-4 shrink-0" aria-hidden />
            Agregar lo que faltó
          </button>
        )}
      </div>
      {activeTenant?.id && order.customer_phone && (
        <div className="mt-3 border-t border-border-soft pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Comunicación con el cliente
          </p>
          <WhatsAppShareButton
            tenantId={activeTenant.id}
            entityType="order"
            entityId={order.id}
            recipientPhone={order.customer_phone}
            eventType="pickup_ready_shared"
            buttonClassName="w-full sm:w-auto"
          />
        </div>
      )}

      {activeTenant && (
        <AddendumSheet
          isOpen={addendumOpen}
          onClose={() => setAddendumOpen(false)}
          tenantId={activeTenant.id}
          parentOrderId={order.id}
          onCreated={(childId) =>
            router.push(`/dashboard/${tenantSlug}/ordenes/${childId}`)
          }
        />
      )}

      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={async () => {
          await handleStatusChange("cancelled");
          setCancelModalOpen(false);
        }}
        title="Cancelar orden"
        message="¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer y la orden no podrá recuperarse."
        confirmLabel="Sí, cancelar"
        confirmDanger={true}
        loading={actionLoading}
      />
      <ConfirmModal isOpen={acceptRequestOpen} onClose={() => setAcceptRequestOpen(false)} onConfirm={() => void resolvePublicRequest("accept-request")} title="Aceptar solicitud" message="Se validará la disponibilidad y el pedido pasará a preparación. El cliente podrá ver que fue aceptado." confirmLabel="Aceptar pedido" confirmDanger={false} loading={requestLoading} />
      <ConfirmModal isOpen={rejectRequestOpen} onClose={() => setRejectRequestOpen(false)} onConfirm={() => void resolvePublicRequest("reject-request")} title="Rechazar solicitud" message="El pedido se cancelará y el cliente verá que no puede atenderse por ahora." confirmLabel="Rechazar pedido" confirmDanger loading={requestLoading} />
      <ConfirmModal
        isOpen={completePickupOpen}
        onClose={() => setCompletePickupOpen(false)}
        onConfirm={() => void completePickup()}
        title="Confirmar recolección"
        message="Confirma sólo cuando el cliente ya se llevó el pedido. Se registrará quién y cuándo lo cerró."
        confirmLabel="Sí, ya recogió"
        confirmDanger={false}
        loading={requestLoading}
      />

      <AssignBeforePaidModal
        isOpen={assignBeforePaidModalOpen}
        onClose={() => setAssignBeforePaidModalOpen(false)}
        onConfirm={async (assignToId, paymentMethod) => {
          const paid = await handleAssignAndMarkPaid(assignToId, paymentMethod);
          if (paid) router.replace(`/dashboard/${tenantSlug}/ordenes`);
          setAssignBeforePaidModalOpen(false);
        }}
        team={team}
        loading={actionLoading}
      />

      <ConfirmPaymentModal
        isOpen={confirmPaymentModalOpen}
        onClose={() => setConfirmPaymentModalOpen(false)}
        onConfirm={async (paymentMethod) => {
          const paid = await handleMarkAsPaidWithMethod(paymentMethod);
          if (paid) router.replace(`/dashboard/${tenantSlug}/ordenes`);
          setConfirmPaymentModalOpen(false);
        }}
        total={Number(order.total)}
        loading={actionLoading}
      />

      <GenerateLinkModal
        isOpen={generateLinkModalOpen}
        onClose={() => setGenerateLinkModalOpen(false)}
        onConfirm={async () => {
          await handleGeneratePaymentLink();
          setGenerateLinkModalOpen(false);
        }}
        vendorTotal={Number(order.total)}
        customerName={order.customer_name}
        customerEmail={order.customer_email}
        loading={actionLoading}
      />
      {activeTenant && (
        <OrderCreditSheet
          open={creditSheetOpen}
          onClose={() => setCreditSheetOpen(false)}
          tenantId={activeTenant.id}
          orderId={order.id}
          customerId={order.customer_id}
          total={Number(order.total)}
          onCharged={fetchOrder}
        />
      )}
    </div>
  );
}
