"use client";

import { useState } from "react";
import useSWR from "swr";

import { apiFetch } from "@/services/apiFetch";
import { swrFetcher } from "@/lib/swrFetcher";
import { useActiveTenant } from "@/stores/useTenantStore";

interface TenantPaymentMethod {
  id: string;
  kind: "bank_transfer" | "cash";
  label: string | null;
  bank_name: string | null;
  account_holder: string | null;
  clabe: string | null;
}

export default function BankAccountsPage() {
  const activeTenant = useActiveTenant();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = activeTenant?.id
    ? `/api/tenant-payment-methods?tenant_id=${encodeURIComponent(activeTenant.id)}`
    : null;
  const { data, mutate } = useSWR<TenantPaymentMethod[]>(key, swrFetcher, {
    fallbackData: [],
  });

  async function createDefaultBankMethod() {
    if (!activeTenant) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/api/tenant-payment-methods", {
        method: "POST",
        body: JSON.stringify({
          tenant_id: activeTenant.id,
          kind: "bank_transfer",
          label: "Transferencia principal",
          bank_name: "Banco",
          account_holder: "Titular",
          clabe: "000000000000000000",
          account_number: "",
          is_active: true,
        }),
      });
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Cuentas bancarias
          </h1>
          <p className="text-sm text-muted-foreground">
            Datos para mostrar transferencia al cliente.
          </p>
        </div>
        <button
          type="button"
          onClick={createDefaultBankMethod}
          disabled={saving}
          className="min-h-[44px] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Agregar cuenta"}
        </button>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="space-y-3">
        {(data ?? []).map((method) => (
          <article key={method.id} className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {method.label ?? "Cuenta sin nombre"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {method.bank_name} · {method.account_holder}
            </p>
            <p className="mt-1 font-mono text-sm">{method.clabe ?? "Sin CLABE"}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
