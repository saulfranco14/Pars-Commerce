import { apiFetch } from "@/services/apiFetch";

import type {
  TenantPaymentMethod,
  CreateBankAccountPayload,
  UpdateBankAccountPayload,
} from "@/features/configuracion/interfaces/bankAccount";

export async function listBankAccounts(
  tenantId: string,
): Promise<TenantPaymentMethod[]> {
  return (await apiFetch(
    `/api/tenant-payment-methods?tenant_id=${encodeURIComponent(tenantId)}`,
  )) as TenantPaymentMethod[];
}

export async function createBankAccount(
  payload: CreateBankAccountPayload,
): Promise<TenantPaymentMethod> {
  return (await apiFetch("/api/tenant-payment-methods", {
    method: "POST",
    body: JSON.stringify(payload),
  })) as TenantPaymentMethod;
}

export async function updateBankAccount(
  payload: UpdateBankAccountPayload,
): Promise<TenantPaymentMethod> {
  return (await apiFetch("/api/tenant-payment-methods", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })) as TenantPaymentMethod;
}

export async function deleteBankAccount(
  tenantId: string,
  id: string,
): Promise<void> {
  await apiFetch(
    `/api/tenant-payment-methods?tenant_id=${encodeURIComponent(tenantId)}&id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}
