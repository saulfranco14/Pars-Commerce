"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTenantStore } from "@/stores/useTenantStore";
import { getById as getOrder, update as updateOrder } from "@/services/ordersService";
import { list as listTeam } from "@/services/teamService";
import { remove as removeOrderItem } from "@/services/orderItemsService";
import { generatePaymentLink } from "@/services/mercadopagoService";
import { OrderDetail, TeamMemberOption } from "../types";

interface OrderContextType {
  order: OrderDetail | null;
  team: TeamMemberOption[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  tenantSlug: string;
  businessName: string;
  fetchOrder: () => Promise<void>;
  handleStatusChange: (newStatus: string) => Promise<void>;
  handleAssign: (assignToId: string) => Promise<void>;
  handleSaveCustomer: (details: { name: string; email: string; phone: string }) => Promise<void>;
  handleRemoveItem: (itemId: string) => Promise<void>;
  handleGeneratePaymentLink: () => Promise<void>;
  setError: (msg: string | null) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const orderId = params.orderId as string;
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const businessName = activeTenant?.name ?? "Negocio";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [team, setTeam] = useState<TeamMemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await getOrder(orderId);
      setOrder(data as OrderDetail);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la orden");
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    fetchOrder().finally(() => setLoading(false));
  }, [orderId, fetchOrder]);

  useEffect(() => {
    if (!activeTenant?.id) return;
    listTeam(activeTenant.id)
      .then((list) => setTeam(list.map((m) => ({ 
        user_id: m.user_id, 
        display_name: m.display_name, 
        email: m.email 
      }))))
      .catch(() => setTeam([]));
  }, [activeTenant?.id]);

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
    try {
      const payload: { assigned_to: string | null; status?: string } = {
        assigned_to: assignToId || null,
      };
      
      // Solo transicionamos a 'assigned' si estaba en 'draft'
      if (order.status === "draft" && assignToId) {
        payload.status = "assigned";
      }

      await updateOrder(order.id, payload);
      await fetchOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar");
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

  return (
    <OrderContext.Provider
      value={{
        order,
        team,
        loading,
        actionLoading,
        error,
        tenantSlug,
        businessName,
        fetchOrder,
        handleStatusChange,
        handleAssign,
        handleSaveCustomer,
        handleRemoveItem,
        handleGeneratePaymentLink,
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
