"use client";

import { MercadoPagoConnectionCard } from "@/features/payment-providers/components/MercadoPagoConnectionCard";
import { SettingField } from "@/features/configuracion/components/cobros/SettingField";

import type { SetupPaymentDetailsProps } from "@/features/onboarding/interfaces/setupCheckout";

const PANEL = "store-step-forward mt-4 space-y-4 rounded-2xl border border-border bg-[#f8f9fb] p-4";

/** Bank data for transfers or the Mercado Pago connection for digital payments; cash needs nothing more. */
export function SetupPaymentDetails({ tenantId, method, transfer, onTransferChange }: SetupPaymentDetailsProps) {
  if (method === "transfer") {
    return (
      <div key="transfer" className={PANEL}>
        <p className="text-sm font-semibold text-foreground">¿A qué cuenta te transfieren?</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingField label="Banco" value={transfer.bank_name} placeholder="BBVA" onChange={(bank_name) => onTransferChange({ ...transfer, bank_name })} />
          <SettingField
            label="Titular"
            value={transfer.account_holder}
            placeholder="Nombre como aparece en el banco"
            onChange={(account_holder) => onTransferChange({ ...transfer, account_holder })}
          />
        </div>
        <SettingField
          label="CLABE (18 dígitos)"
          value={transfer.clabe}
          inputMode="numeric"
          placeholder="012 180 0012 3456 7890"
          onChange={(clabe) => onTransferChange({ ...transfer, clabe: clabe.replace(/[^\d ]/g, "") })}
        />
      </div>
    );
  }
  if (method === "digital") {
    return (
      <div key="digital" className="store-step-forward mt-4">
        <MercadoPagoConnectionCard tenantId={tenantId} canManage />
      </div>
    );
  }
  return null;
}
