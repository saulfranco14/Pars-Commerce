import { useCallback } from "react";
import { create } from "zustand";
import type { Tenant, TenantRole } from "@/types/database";

export interface MembershipItem {
  id: string;
  tenant_id: string;
  role_id: string;
  accepted_at: string | null;
  tenant: Tenant;
  role: TenantRole;
}

interface TenantState {
  memberships: MembershipItem[];
  tenantsLoaded: boolean;
  activeTenantId: string | null;
  setMemberships: (memberships: MembershipItem[]) => void;
  setTenantsLoaded: (loaded: boolean) => void;
  setActiveTenantId: (id: string | null) => void;
  activeTenant: () => Tenant | null;
  activeRole: () => TenantRole | null;
  clear: () => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  memberships: [],
  tenantsLoaded: false,
  activeTenantId: null,
  setMemberships: (memberships) => set({ memberships }),
  setTenantsLoaded: (tenantsLoaded) => set({ tenantsLoaded }),
  setActiveTenantId: (activeTenantId) => set({ activeTenantId }),
  activeTenant: () => {
    const { memberships, activeTenantId } = get();
    if (!activeTenantId) return null;
    return (
      memberships.find((m) => m.tenant_id === activeTenantId)?.tenant ?? null
    );
  },
  activeRole: () => {
    const { memberships, activeTenantId } = get();
    if (!activeTenantId) return null;
    return (
      memberships.find((m) => m.tenant_id === activeTenantId)?.role ?? null
    );
  },
  clear: () => set({ memberships: [], tenantsLoaded: false, activeTenantId: null }),
}));

export function useActiveTenant(): Tenant | null {
  return useTenantStore((s) => s.activeTenant());
}

/**
 * Comprueba un permiso del rol activo. Espejo cliente de
 * `requirePermission`, incluida la excepción del owner.
 *
 * Es para DECIDIR QUÉ MOSTRAR, no para autorizar: el permiso de verdad lo
 * comprueba el servidor. Ocultar un botón sin cerrar su endpoint no protege
 * nada; enseñar un botón que va a devolver 403 solo frustra.
 *
 *   const can = usePermission();
 *   if (can(ORDER_PERMISSIONS.assign)) { ... }
 */
export function usePermission(): (permission: string) => boolean {
  const role = useTenantStore((s) => s.activeRole());
  return useCallback(
    (permission: string) =>
      role?.name === "owner" || (role?.permissions ?? []).includes(permission),
    [role],
  );
}
