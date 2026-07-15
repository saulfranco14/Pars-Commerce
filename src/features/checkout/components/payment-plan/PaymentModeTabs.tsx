"use client";

import { CreditCard, Repeat, SplitSquareHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface PaymentModeTabsProps {
  paymentMode: PaymentMode;
  onChange: (mode: PaymentMode) => void;
  installmentsEnabled: boolean;
  recurringEnabled: boolean;
  accentColor: string;
}

interface TabConfig {
  mode: PaymentMode;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
}

export function PaymentModeTabs({
  paymentMode,
  onChange,
  installmentsEnabled,
  recurringEnabled,
  accentColor,
}: PaymentModeTabsProps) {
  const tabs: TabConfig[] = [
    { mode: "single", label: "Pago único", icon: CreditCard, enabled: true },
    {
      mode: "installments",
      label: "Abonos",
      icon: SplitSquareHorizontal,
      enabled: installmentsEnabled,
    },
    {
      mode: "recurring",
      label: "Suscripción",
      icon: Repeat,
      enabled: recurringEnabled,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">
        ¿Cómo quieres pagar?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {tabs
          .filter((tab) => tab.enabled)
          .map(({ mode, label, icon: Icon }) => {
            const isActive = paymentMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onChange(mode)}
                className={`flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                  isActive
                    ? "border-current bg-current/5"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={
                  isActive
                    ? { color: accentColor, borderColor: accentColor }
                    : undefined
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="text-xs font-semibold leading-tight">
                  {label}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
