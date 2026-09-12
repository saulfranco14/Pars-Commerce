import { apiFetch } from "@/services/apiFetch";
import type {
  SettlementsResponse,
  SettlementConfigResponse,
  SettlementCycle,
} from "@/types/settlement";

/** Liquidaciones de un negocio (owner) — el "¿cuándo recibo mi dinero?". */
export async function listSettlements(
  tenantId: string,
): Promise<SettlementsResponse> {
  return (await apiFetch(
    `/api/settlements?tenant_id=${encodeURIComponent(tenantId)}`,
  )) as SettlementsResponse;
}

/** Config de ciclo del negocio + preview de comisión por ciclo. */
export async function getSettlementConfig(
  tenantId: string,
): Promise<SettlementConfigResponse> {
  return (await apiFetch(
    `/api/settlement-config?tenant_id=${encodeURIComponent(tenantId)}`,
  )) as SettlementConfigResponse;
}

/** El negocio cambia su ciclo de liquidación. */
export async function updateSettlementConfig(payload: {
  tenant_id: string;
  cycle_type: SettlementCycle;
  custom_cycle_days?: number | null;
}): Promise<unknown> {
  return await apiFetch("/api/settlement-config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
