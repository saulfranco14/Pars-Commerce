import type { LucideIcon } from "lucide-react";
import { Banknote, Building2, CreditCard, Smartphone } from "lucide-react";

const PAYMENT_METHOD_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; iconClass?: string }
> = {
  efectivo: { label: "Efectivo", icon: Banknote, iconClass: "text-emerald-600" },
  transferencia: {
    label: "Transferencia",
    icon: Building2,
    iconClass: "text-violet-600",
  },
  tarjeta: { label: "Tarjeta", icon: CreditCard, iconClass: "text-blue-600" },
  mercadopago: {
    label: "Mercado Pago",
    icon: Smartphone,
    iconClass: "text-blue-600",
  },
};

export function formatPaymentMethod(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "";
  const normalized = value.toLowerCase().trim();
  return PAYMENT_METHOD_CONFIG[normalized]?.label ?? value;
}

export function getPaymentMethodConfig(
  value: string | null | undefined
): (typeof PAYMENT_METHOD_CONFIG)[string] | null {
  if (!value || typeof value !== "string") return null;
  const normalized = value.toLowerCase().trim();
  return PAYMENT_METHOD_CONFIG[normalized] ?? null;
}
