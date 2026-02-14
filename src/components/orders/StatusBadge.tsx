"use client";

import {
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  UserCheck,
  XCircle,
} from "lucide-react";

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

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  assigned: UserCheck,
  in_progress: Loader2,
  completed: CheckCircle,
  pending_payment: Clock,
  paid: CheckCircle,
  cancelled: XCircle,
};

interface StatusBadgeProps {
  status: string;
  cancelledFrom?: string | null;
  showIcon?: boolean;
}

export function StatusBadge({ status, cancelledFrom, showIcon = true }: StatusBadgeProps) {
  const baseLabel = STATUS_LABELS[status] ?? status;
  const fromLabel = cancelledFrom ? STATUS_LABELS[cancelledFrom] ?? cancelledFrom : null;
  const label = status === "cancelled" && fromLabel
    ? `${baseLabel} (era ${fromLabel})`
    : baseLabel;
  const className = STATUS_CLASSES[status] ?? "bg-border-soft text-muted-foreground";
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {showIcon && Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {label}
    </span>
  );
}
