"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { buildPaymentMethodKey } from "@/features/configuracion/helpers/buildPaymentMethodKey";
import {
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "@/features/configuracion/services/bankAccountService";

import type { TenantPaymentMethod, CreateBankAccountPayload } from "@/features/configuracion/interfaces/bankAccount";
import type { BankAccountFieldValues } from "@/features/configuracion/validations/bankAccountFieldSchema";

export function useBankAccounts(tenantId: string | null) {
  const key = buildPaymentMethodKey(tenantId);
  const sanitizedRef = useRef(false);

  const { data, isLoading, mutate } = useSWR<TenantPaymentMethod[]>(
    key,
    swrFetcher,
    { fallbackData: [], revalidateOnFocus: false },
  );

  const accounts = data ?? [];
  const activeAccounts = accounts.filter((a) => a.is_active);
  const activeAccount = activeAccounts[0] ?? null;

  useEffect(() => {
    if (sanitizedRef.current) return;
    if (!tenantId || activeAccounts.length <= 1) return;
    sanitizedRef.current = true;
    updateBankAccount({ id: activeAccounts[0].id, tenant_id: tenantId, is_active: true })
      .then(() => mutate())
      .catch(() => { sanitizedRef.current = false; });
  }, [activeAccounts.length, tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  function isClabeDuplicated(clabe: string, excludeId?: string): boolean {
    return accounts.some(
      (a) => a.clabe === clabe && a.id !== excludeId,
    );
  }

  async function handleCreate(values: BankAccountFieldValues) {
    if (!tenantId) return;
    if (isClabeDuplicated(values.clabe)) {
      throw new Error("Ya existe una cuenta con esa CLABE en este negocio.");
    }
    const payload: CreateBankAccountPayload = {
      tenant_id: tenantId,
      kind: "bank_transfer",
      label: values.label,
      bank_name: values.bank_name,
      account_holder: values.account_holder,
      clabe: values.clabe,
      account_number: values.account_number?.trim() || undefined,
      is_active: accounts.length === 0,
    };
    await createBankAccount(payload);
    await mutate();
  }

  async function handleUpdate(id: string, values: BankAccountFieldValues) {
    if (!tenantId) return;
    if (isClabeDuplicated(values.clabe, id)) {
      throw new Error("Ya existe otra cuenta con esa CLABE en este negocio.");
    }
    await updateBankAccount({
      id,
      tenant_id: tenantId,
      label: values.label,
      bank_name: values.bank_name,
      account_holder: values.account_holder,
      clabe: values.clabe,
      account_number: values.account_number?.trim() || null,
    });
    await mutate();
  }

  async function handleSetActive(id: string) {
    if (!tenantId) return;

    // Optimistic update: flip is_active locally before the request lands,
    // so the UI reflects the change instantly.
    const optimistic = accounts.map((a) => ({
      ...a,
      is_active: a.id === id,
    }));

    await mutate(
      async () => {
        await updateBankAccount({ id, tenant_id: tenantId, is_active: true });
        return optimistic;
      },
      {
        optimisticData: optimistic,
        rollbackOnError: true,
        revalidate: true,
      },
    );
  }

  async function handleDelete(id: string) {
    if (!tenantId) return;
    await deleteBankAccount(tenantId, id);
    await mutate();
  }

  return {
    accounts,
    activeAccount,
    isLoading,
    handleCreate,
    handleUpdate,
    handleSetActive,
    handleDelete,
  };
}
