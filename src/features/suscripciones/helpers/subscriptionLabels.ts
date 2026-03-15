import type { SubscriptionStatus, SubscriptionType } from "@/types/subscriptions";

export function subscriptionStatusLabel(status: SubscriptionStatus): string {
  const map: Record<SubscriptionStatus, string> = {
    pending_setup: "Pendiente",
    active: "Activa",
    paused: "Pausada",
    card_failed: "Error tarjeta",
    completed: "Completada",
    cancelled: "Cancelada",
  };
  return map[status] ?? status;
}

export function subscriptionStatusColor(status: SubscriptionStatus): string {
  const map: Record<SubscriptionStatus, string> = {
    pending_setup: "bg-amber-100 text-amber-800",
    active: "bg-emerald-100 text-emerald-800",
    paused: "bg-blue-100 text-blue-800",
    card_failed: "bg-red-100 text-red-800",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-50 text-red-600",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

export function subscriptionTypeLabel(type: SubscriptionType): string {
  return type === "installments" ? "Cuotas" : "Recurrente";
}

export function freqLabel(frequency: number, frequencyType: "weeks" | "months"): string {
  if (frequencyType === "weeks" && frequency === 1) return "Semanal";
  if (frequencyType === "weeks" && frequency === 2) return "Quincenal";
  if (frequencyType === "months" && frequency === 1) return "Mensual";
  return `Cada ${frequency} ${frequencyType === "weeks" ? "semanas" : "meses"}`;
}
