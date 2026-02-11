"use client";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  assigned: "Asignada",
  in_progress: "En progreso",
  completed: "Completada",
  pending_payment: "Pago pendiente",
  paid: "Pagada",
  cancelled: "Cancelada",
};

const STATUS_CLASSES: Record<string, string> = {
  draft: "bg-border-soft text-muted-foreground",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-green-100 text-green-800",
  pending_payment: "bg-orange-100 text-orange-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

interface StatusBadgeProps {
  status: string;
  cancelledFrom?: string | null;
}

export function StatusBadge({ status, cancelledFrom }: StatusBadgeProps) {
  const baseLabel = STATUS_LABELS[status] ?? status;
  const fromLabel = cancelledFrom ? STATUS_LABELS[cancelledFrom] ?? cancelledFrom : null;
  const label = status === "cancelled" && fromLabel
    ? `${baseLabel} (era ${fromLabel})`
    : baseLabel;
  const className = STATUS_CLASSES[status] ?? "bg-border-soft text-muted-foreground";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
