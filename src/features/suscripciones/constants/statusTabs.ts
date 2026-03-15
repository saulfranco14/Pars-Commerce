export const SUBSCRIPTION_STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "pending_setup", label: "Pendiente" },
  { value: "active", label: "Activa" },
  { value: "paused", label: "Pausada" },
  { value: "completed", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "card_failed", label: "Error tarjeta" },
];

export const SUBSCRIPTION_TYPE_TABS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "installments", label: "Cuotas" },
  { value: "recurring", label: "Recurrente" },
];
