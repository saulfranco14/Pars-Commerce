"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { update as updateOrder } from "@/services/ordersService";
import { remove as removeOrderItem } from "@/services/orderItemsService";
import { generatePaymentLink } from "@/services/mercadopagoService";
import { swrFetcher } from "@/lib/swrFetcher";
import type { TenantAddress } from "@/types/database";
import type { TeamMember } from "@/types/team";
import { OrderDetail, TeamMemberOption } from "../types";

interface OrderContextType {
  order: OrderDetail | null;
  team: TeamMemberOption[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  assignmentSuccess: boolean;
  tenantSlug: string;
  businessName: string;
  businessAddress: TenantAddress | null;
  fetchOrder: () => Promise<void>;
  handleStatusChange: (newStatus: string) => Promise<void>;
  handleAssign: (assignToId: string) => Promise<void>;
  handleAssignAndMarkPaid: (assignToId: string, paymentMethod?: string) => Promise<void>;
  handleMarkAsPaidWithMethod: (paymentMethod: string) => Promise<void>;
  handleExpressToPayment: () => Promise<boolean>;
  handleSaveCustomer: (details: { name: string; email: string; phone: string }) => Promise<void>;
  handleRemoveItem: (itemId: string) => Promise<void>;
  handleGeneratePaymentLink: () => Promise<void>;
  handleSaveDiscount: (amount: number) => Promise<void>;
  setError: (msg: string | null) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

function mapToTeamOptions(list: TeamMember[] | undefined): TeamMemberOption[] {
  if (!Array.isArray(list)) return [];
  return list.map((m) => ({
    user_id: m.user_id,
    display_name: m.display_name,
    email: m.email,
  }));
}

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const orderId = params.orderId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const businessName = activeTenant?.name ?? "Negocio";
  const businessAddress = activeTenant?.address ?? null;

  const orderKey = orderId
    ? `/api/orders?order_id=${encodeURIComponent(orderId)}`
    : null;
  const teamKey = activeTenant?.id
    ? `/api/team?tenant_id=${encodeURIComponent(activeTenant.id)}`
    : null;

  const { data: orderData, error: orderError, isLoading, mutate } = useSWR<
    OrderDetail | null
  >(orderKey, swrFetcher);

  const { data: teamData } = useSWR<TeamMember[]>(teamKey, swrFetcher);

  const order = orderData ?? null;
  const team = useMemo(() => mapToTeamOptions(teamData), [teamData]);

  const [actionLoading, setActionLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  const loading = isLoading;
  const error =
    manualError ?? (orderError ? "No se pudo cargar la orden" : null);

  const setError = (msg: string | null) => setManualError(msg);

  const fetchOrder = () => mutate();

  useEffect(() => {
    if (!assignmentSuccess) return;
    const t = setTimeout(() => setAssignmentSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [assignmentSuccess]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateOrder(order.id, { status: newStatus });
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar el estado");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (assignToId: string) => {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    setAssignmentSuccess(false);
    try {
      const payload: { assigned_to: string | null; status?: string } = {
        assigned_to: assignToId || null,
      };

      if (order.status === "draft" && assignToId) {
        payload.status = "assigned";
      }

      await updateOrder(order.id, payload);
      await fetchOrder();
      setAssignmentSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAndMarkPaid = async (assignToId: string, paymentMethod?: string) => {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    setAssignmentSuccess(false);
    try {
      await updateOrder(order.id, {
        assigned_to: assignToId,
        status: "paid",
        payment_method: paymentMethod?.trim() || null,
      });
      await fetchOrder();
      setAssignmentSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar y cobrar");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaidWithMethod = async (paymentMethod: string) => {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateOrder(order.id, {
        status: "paid",
        payment_method: paymentMethod.trim() || null,
      });
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar cobro");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExpressToPayment = async (): Promise<boolean> => {
    if (!order) return false;
    setActionLoading(true);
    setError(null);
    try {
      let currentStatus = order.status;
      const orderId = order.id;
      if (currentStatus === "draft" || currentStatus === "assigned") {
        await updateOrder(orderId, { status: "in_progress" });
        await fetchOrder();
        currentStatus = "in_progress";
      }
      if (currentStatus === "in_progress") {
        await updateOrder(orderId, { status: "completed" });
        await fetchOrder();
        currentStatus = "completed";
      }
      return currentStatus === "completed";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al ir al cobro");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCustomer = async (details: { name: string; email: string; phone: string }) => {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateOrder(order.id, {
        customer_name: details.name.trim() || null,
        customer_email: details.email.trim() || null,
        customer_phone: details.phone.trim() || null,
      });
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar cliente");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await removeOrderItem(itemId);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al quitar item");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      await generatePaymentLink(order.id);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar link de pago");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveDiscount = async (amount: number) => {
    if (!order) return;
    setActionLoading(true);
    setError(null);
    try {
      await updateOrder(order.id, { discount: amount });
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar descuento");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        order,
        team,
        loading,
        actionLoading,
        error,
        assignmentSuccess,
        tenantSlug,
        businessName,
        businessAddress,
        fetchOrder,
        handleStatusChange,
        handleAssign,
        handleAssignAndMarkPaid,
        handleMarkAsPaidWithMethod,
        handleExpressToPayment,
        handleSaveCustomer,
        handleRemoveItem,
        handleGeneratePaymentLink,
        handleSaveDiscount,
        setError,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
