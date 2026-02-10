"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Printer, MessageCircle } from "lucide-react";
import { useTenantStore } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { AddItemModal } from "@/components/orders/AddItemModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { formatOrderDate } from "@/lib/formatDate";
import { getById as getOrder, update as updateOrder } from "@/services/ordersService";
import { list as listTeam } from "@/services/teamService";
import { remove as removeOrderItem } from "@/services/orderItemsService";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: { id: string; name: string; type: string } | null;
}

interface OrderDetail {
  id: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  created_at: string;
  assigned_to: string | null;
  assigned_user?: {
    id: string;
    display_name: string | null;
    email: string | null;
  } | null;
  payment_method: string | null;
  items: OrderItem[];
}

interface TeamMemberOption {
  user_id: string;
  display_name: string;
  email: string;
}

function buildTicketText(
  order: OrderDetail,
  items: OrderItem[],
  businessName: string
): string {
  const lines: string[] = [
    `*${businessName}*`,
    `Orden ${order.id.slice(0, 8)} · ${formatOrderDate(order.created_at)}`,
    "",
    order.customer_name || order.customer_email
      ? `Cliente: ${order.customer_name || order.customer_email}`
      : "",
    order.customer_phone ? `Tel: ${order.customer_phone}` : "",
    "",
    "Items:",
    ...items.map(
      (i) =>
        `• ${i.product?.name ?? "—"} x${i.quantity} $${Number(i.subtotal).toFixed(2)}`
    ),
    "",
    `Subtotal: $${Number(order.subtotal).toFixed(2)}`,
    ...(Number(order.discount) > 0
      ? [`Descuento: -$${Number(order.discount).toFixed(2)}`]
      : []),
    `*Total: $${Number(order.total).toFixed(2)}*`,
  ];
  return lines.filter(Boolean).join("\n");
}

function getWhatsAppTicketUrl(
  order: OrderDetail,
  items: OrderItem[],
  businessName: string
): string {
  const text = buildTicketText(order, items, businessName);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function OrdenDetallePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [team, setTeam] = useState<TeamMemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cancelOrderOpen, setCancelOrderOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<OrderItem | null>(null);
  const [ticketSectionOpen, setTicketSectionOpen] = useState(false);

  function fetchOrder() {
    return getOrder(orderId).then((data) => setOrder(data as OrderDetail));
  }

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    fetchOrder()
      .catch(() => setError("No se pudo cargar la orden"))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (!activeTenant?.id) return;
    listTeam(activeTenant.id)
      .then((list) => setTeam(list.map((m) => ({ user_id: m.user_id, display_name: m.display_name, email: m.email }))))
      .catch(() => setTeam([]));
  }, [activeTenant?.id]);

  useEffect(() => {
    if (order?.assigned_to) setAssignTo(order.assigned_to);
  }, [order?.assigned_to]);

  useEffect(() => {
    if (order) {
      setCustomerName(order.customer_name ?? "");
      setCustomerEmail(order.customer_email ?? "");
      setCustomerPhone(order.customer_phone ?? "");
    }
  }, [
    order?.id,
    order?.customer_name,
    order?.customer_email,
    order?.customer_phone,
  ]);

  async function handleStatusChange(newStatus: string) {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateOrder(order.id, { status: newStatus });
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAssign() {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      const payload: { assigned_to: string | null; status?: string } = {
        assigned_to: assignTo || null,
      };
      if (order.status === "draft" && assignTo) payload.status = "assigned";
      if (order.status === "assigned" && !assignTo) payload.status = "draft";
      await updateOrder(order.id, payload);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnassign() {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateOrder(order.id, { assigned_to: null, status: "draft" });
      setAssignTo("");
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveCustomer() {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateOrder(order.id, {
        customer_name: customerName.trim() || null,
        customer_email: customerEmail.trim() || null,
        customer_phone: customerPhone.trim() || null,
      });
      setEditingCustomer(false);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  function openRemoveItemModal(item: OrderItem) {
    setItemToRemove(item);
  }

  async function handleRemoveItemConfirm() {
    if (!itemToRemove) return;
    const itemId = itemToRemove.id;
    setItemToRemove(null);
    setActionLoading(true);
    setError(null);
    try {
      await removeOrderItem(itemId);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setActionLoading(false);
    }
  }

  function openCancelOrderModal() {
    setCancelOrderOpen(true);
  }

  async function handleCancelOrderConfirm() {
    if (!order) return;
    setCancelOrderOpen(false);
    await handleStatusChange("cancelled");
  }

  if (error && !order) {
    return (
      <div className="text-sm text-muted-foreground">
        {error}{" "}
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="text-foreground underline"
        >
          Volver a órdenes
        </Link>
      </div>
    );
  }

  if (!order) {
    return <LoadingBlock message="Cargando orden…" />;
  }

  const canEditItems = ["draft", "assigned"].includes(order.status);
  const items = order.items ?? [];
  const businessName = activeTenant?.name ?? "Negocio";

  return (
    <>
      <div
        id="ticket-print"
        className="hidden p-6"
        aria-hidden
      >
        <div className="mx-auto max-w-sm font-sans text-foreground">
          <p className="text-lg font-bold">{businessName}</p>
          <p className="text-sm text-muted">
            Orden {order.id.slice(0, 8)} · {formatOrderDate(order.created_at)}
          </p>
          {(order.customer_name || order.customer_email) && (
            <p className="mt-2 text-sm">
              Cliente: {order.customer_name || order.customer_email}
            </p>
          )}
          {order.customer_phone && (
            <p className="text-sm">Tel: {order.customer_phone}</p>
          )}
          <table className="mt-4 w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium">Item</th>
                <th className="w-12 py-2 text-right font-medium">Cant.</th>
                <th className="w-20 py-2 text-right font-medium">P.unit</th>
                <th className="w-20 py-2 text-right font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border-soft">
                  <td className="py-2 text-left">{item.product?.name ?? "—"}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">
                    ${Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-2 text-right">
                    ${Number(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-right text-sm">
            Subtotal: ${Number(order.subtotal).toFixed(2)}
          </p>
          {Number(order.discount) > 0 && (
            <p className="text-right text-sm">
              Descuento: -${Number(order.discount).toFixed(2)}
            </p>
          )}
          <p className="mt-1 border-t-2 border-foreground pt-2 text-right font-bold">
            Total: ${Number(order.total).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="no-print mx-auto max-w-4xl space-y-6 px-2 sm:px-0">
      <div className="shrink-0 border-b border-border pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Volver a órdenes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Orden {order.id.slice(0, 8)}
          </h1>
          <StatusBadge status={order.status} />
          {order.assigned_user && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-border-soft px-3 py-1 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {order.assigned_user.display_name ||
                order.assigned_user.email?.split("@")[0]}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          Creada: {formatOrderDate(order.created_at)}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
        <h2 className="text-sm font-medium text-foreground">Cliente</h2>
        {!editingCustomer ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.customer_name || order.customer_email || "—"}
            </p>
            {order.customer_phone && (
              <p className="text-sm text-muted-foreground">
                Tel: {order.customer_phone}
              </p>
            )}
            {canEditItems && (
              <button
                type="button"
                onClick={() => setEditingCustomer(true)}
                className="mt-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Editar cliente
              </button>
            )}
          </>
        ) : (
          <div className="mt-2 space-y-1">
            <label className="block text-xs font-medium text-muted-foreground">
              Nombre
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Nombre del cliente"
            />
            <label className="mt-3 block text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="cliente@ejemplo.com"
            />
            <label className="mt-3 block text-xs font-medium text-muted-foreground">
              Teléfono
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="555 123 4567"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSaveCustomer}
                disabled={actionLoading}
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingCustomer(false);
                  setCustomerName(order.customer_name ?? "");
                  setCustomerEmail(order.customer_email ?? "");
                  setCustomerPhone(order.customer_phone ?? "");
                }}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-border-soft"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {(order.status === "draft" || order.status === "assigned") && (
        <div className="rounded-xl border border-border bg-border-soft/60 p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-foreground">
            {order.assigned_to
              ? "Orden asignada. Puedes cambiar la asignación o iniciar el trabajo."
              : "Asigna a un miembro del equipo (opcional). Luego inicia la orden."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="input-form select-custom block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">Sin asignar</option>
              {team.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.display_name || t.email}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAssign}
              disabled={actionLoading}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
            >
              {order.assigned_to && assignTo ? "Cambiar asignación" : "Asignar"}
            </button>
            {order.assigned_to && (
              <button
                type="button"
                onClick={handleUnassign}
                disabled={actionLoading}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-border-soft"
              >
                Quitar asignación
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-raised shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-medium text-foreground">Items</h2>
          {canEditItems && activeTenant && (
            <button
              type="button"
              onClick={() => setAddItemOpen(true)}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
            >
              + Agregar item
            </button>
          )}
        </div>
        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted">
              No hay items. Agrega productos o servicios.
            </p>
          ) : (
            <div className="w-full overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-full divide-y divide-border">
                <thead className="bg-border-soft">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                      P. unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                      Subtotal
                    </th>
                    {canEditItems && (
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface-raised">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-border-soft/60">
                      <td className="px-4 py-3 text-sm text-foreground">
                        {item.product?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.product?.type === "service" ? (
                          <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-800">
                            Servicio
                          </span>
                        ) : (
                          <span className="rounded bg-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Producto
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        ${Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        ${Number(item.subtotal).toFixed(2)}
                      </td>
                      {canEditItems && (
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openRemoveItemModal(item)}
                            disabled={actionLoading}
                            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Quitar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="border-t border-border px-4 py-3">
          <div className="flex justify-end gap-8 text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium text-foreground">
              ${Number(order.subtotal).toFixed(2)}
            </span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="mt-1 flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">Descuento:</span>
              <span className="font-medium text-foreground">
                -${Number(order.discount).toFixed(2)}
              </span>
            </div>
          )}
          <div className="mt-2 flex justify-end gap-8 text-base font-medium">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-semibold text-foreground">
              ${Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
        <button
          type="button"
          onClick={() => setTicketSectionOpen((o) => !o)}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-3 text-left sm:px-5"
          aria-expanded={ticketSectionOpen}
          aria-controls="ticket-actions-content"
          id="ticket-actions-trigger"
        >
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">
              Compartir o imprimir ticket
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Envía por WhatsApp o imprímelo para el cliente.
            </p>
          </div>
          <span
            className={`shrink-0 text-muted transition-transform duration-200 ${ticketSectionOpen ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▼
          </span>
        </button>
        {ticketSectionOpen && (
          <div
            id="ticket-actions-content"
            role="region"
            aria-labelledby="ticket-actions-trigger"
            className="border-t border-border px-4 pb-4 pt-3 sm:px-5"
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border-soft/80 active:opacity-90"
                aria-label="Imprimir ticket"
              >
                <Printer className="h-4 w-4 shrink-0" />
                Imprimir ticket
              </button>
              <a
                href={getWhatsAppTicketUrl(order, items, activeTenant?.name ?? "Negocio")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 active:opacity-90"
                aria-label="Enviar ticket por WhatsApp"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                Enviar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {order.status === "draft" && (
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={actionLoading}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            Iniciar sin asignar
          </button>
        )}
        {order.status === "assigned" && (
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={actionLoading}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            Iniciar trabajo
          </button>
        )}
        {order.status === "in_progress" && (
          <button
            type="button"
            onClick={() => handleStatusChange("completed")}
            disabled={actionLoading}
            className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            Marcar completado
          </button>
        )}
        {order.status === "completed" && (
          <>
            <button
              type="button"
              onClick={() => handleStatusChange("pending_payment")}
              disabled={actionLoading}
              className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50"
              title="Pasar a pago pendiente; con Mercado Pago se generará el link para que el cliente pague"
            >
              Generar cobro (link de pago)
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("paid")}
              disabled={actionLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Cobro directo
            </button>
          </>
        )}
        {order.status === "pending_payment" && (
          <>
            <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">Pago pendiente</p>
              <p className="mt-1 text-amber-800">
                El cliente debe pagar. Cuando integres Mercado Pago, aquí se
                mostrará el link para que el cliente pague en línea. Por ahora
                puedes marcar como pagado si el cobro fue por otro medio.
              </p>
              <p className="mt-2 text-xs text-amber-700">
                (Link de pago Mercado Pago: se configurará al conectar tu
                cuenta.)
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleStatusChange("paid")}
              disabled={actionLoading}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Marcar como pagado
            </button>
          </>
        )}
        {["draft", "assigned", "in_progress"].includes(order.status) && (
          <button
            type="button"
            onClick={openCancelOrderModal}
            disabled={actionLoading}
            className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Cancelar orden
          </button>
        )}
      </div>

      {activeTenant && (
        <AddItemModal
          tenantId={activeTenant.id}
          orderId={order.id}
          isOpen={addItemOpen}
          onClose={() => setAddItemOpen(false)}
          onAdded={() => fetchOrder()}
        />
      )}

      <ConfirmModal
        isOpen={cancelOrderOpen}
        onClose={() => setCancelOrderOpen(false)}
        onConfirm={handleCancelOrderConfirm}
        title="Cancelar orden"
        message="¿Cancelar esta orden? El estado pasará a cancelada y no podrás revertirlo."
        confirmLabel="Cancelar orden"
        confirmDanger
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={itemToRemove !== null}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleRemoveItemConfirm}
        title="Quitar item"
        message={
          itemToRemove?.product?.name
            ? `¿Quitar "${itemToRemove.product.name}" de la orden?`
            : "¿Quitar este item de la orden?"
        }
        confirmLabel="Quitar"
        confirmDanger
        loading={actionLoading}
      />
      </div>
    </>
  );
}
