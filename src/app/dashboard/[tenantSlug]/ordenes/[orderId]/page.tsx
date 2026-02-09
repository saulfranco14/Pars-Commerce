"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { AddItemModal } from "@/components/orders/AddItemModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatOrderDate } from "@/lib/formatDate";

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

interface TeamMember {
  user_id: string;
  display_name: string;
  email: string;
}

export default function OrdenDetallePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
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

  function fetchOrder() {
    return fetch(`/api/orders?order_id=${encodeURIComponent(orderId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Orden no encontrada");
        return res.json();
      })
      .then(setOrder);
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
    fetch(`/api/team?tenant_id=${encodeURIComponent(activeTenant.id)}`)
      .then((res) => res.json())
      .then((list: TeamMember[]) => setTeam(list ?? []))
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
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al actualizar");
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
      const body: {
        order_id: string;
        assigned_to: string | null;
        status?: string;
      } = {
        order_id: order.id,
        assigned_to: assignTo || null,
      };
      if (order.status === "draft" && assignTo) {
        body.status = "assigned";
      }
      if (order.status === "assigned" && !assignTo) {
        body.status = "draft";
      }
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al asignar");
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
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          assigned_to: null,
          status: "draft",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al quitar asignación");
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
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          customer_name: customerName.trim() || null,
          customer_email: customerEmail.trim() || null,
          customer_phone: customerPhone.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al guardar");
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
      const res = await fetch(
        `/api/order-items?item_id=${encodeURIComponent(itemId)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al quitar");
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
      <div className="text-sm text-zinc-600">
        {error}{" "}
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="text-zinc-900 underline"
        >
          Volver a órdenes
        </Link>
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-zinc-500">Cargando...</p>;
  }

  const canEditItems = ["draft", "assigned"].includes(order.status);
  const items = order.items ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="shrink-0 border-b border-zinc-200 pb-4">
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a órdenes
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
            Orden {order.id.slice(0, 8)}
          </h1>
          <StatusBadge status={order.status} />
          {order.assigned_user && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {order.assigned_user.display_name ||
                order.assigned_user.email?.split("@")[0]}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Creada: {formatOrderDate(order.created_at)}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-medium text-zinc-900">Cliente</h2>
        {!editingCustomer ? (
          <>
            <p className="mt-2 text-sm text-zinc-600">
              {order.customer_name || order.customer_email || "—"}
            </p>
            {order.customer_phone && (
              <p className="text-sm text-zinc-600">
                Tel: {order.customer_phone}
              </p>
            )}
            {canEditItems && (
              <button
                type="button"
                onClick={() => setEditingCustomer(true)}
                className="mt-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
              >
                Editar cliente
              </button>
            )}
          </>
        ) : (
          <div className="mt-2 space-y-1">
            <label className="block text-xs font-medium text-zinc-600">
              Nombre
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="Nombre del cliente"
            />
            <label className="mt-3 block text-xs font-medium text-zinc-600">
              Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="cliente@ejemplo.com"
            />
            <label className="mt-3 block text-xs font-medium text-zinc-600">
              Teléfono
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
              placeholder="555 123 4567"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleSaveCustomer}
                disabled={actionLoading}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
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
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {(order.status === "draft" || order.status === "assigned") && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-zinc-900">
            {order.assigned_to
              ? "Orden asignada. Puedes cambiar la asignación o iniciar el trabajo."
              : "Asigna a un miembro del equipo (opcional). Luego inicia la orden."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
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
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {order.assigned_to && assignTo ? "Cambiar asignación" : "Asignar"}
            </button>
            {order.assigned_to && (
              <button
                type="button"
                onClick={handleUnassign}
                disabled={actionLoading}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Quitar asignación
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <h2 className="text-lg font-medium text-zinc-900">Items</h2>
          {canEditItems && activeTenant && (
            <button
              type="button"
              onClick={() => setAddItemOpen(true)}
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              + Agregar item
            </button>
          )}
        </div>
        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No hay items. Agrega productos o servicios.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      P. unit.
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Subtotal
                    </th>
                    {canEditItems && (
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3 text-sm text-zinc-900">
                        {item.product?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {item.product?.type === "service" ? (
                          <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-800">
                            Servicio
                          </span>
                        ) : (
                          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                            Producto
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600">
                        ${Number(item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
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
        <div className="border-t border-zinc-200 px-4 py-3">
          <div className="flex justify-end gap-8 text-sm">
            <span className="text-zinc-600">Subtotal:</span>
            <span className="font-medium text-zinc-900">
              ${Number(order.subtotal).toFixed(2)}
            </span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="mt-1 flex justify-end gap-8 text-sm">
              <span className="text-zinc-600">Descuento:</span>
              <span className="font-medium text-zinc-900">
                -${Number(order.discount).toFixed(2)}
              </span>
            </div>
          )}
          <div className="mt-2 flex justify-end gap-8 text-base font-medium">
            <span className="text-zinc-600">Total:</span>
            <span className="font-semibold text-zinc-900">
              ${Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {order.status === "draft" && (
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={actionLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Iniciar sin asignar
          </button>
        )}
        {order.status === "assigned" && (
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={actionLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
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
  );
}
