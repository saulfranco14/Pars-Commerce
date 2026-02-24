"use client";

import {
  STATUS_LABELS,
  STATUS_CLASSES,
  STATUS_ICONS,
} from "@/features/orders/constants/statusBadge";

interface StatusBadgeProps {
  status: string;
  cancelledFrom?: string | null;
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  cancelledFrom,
  showIcon = true,
}: StatusBadgeProps) {
  const baseLabel = STATUS_LABELS[status] ?? status;
  const fromLabel = cancelledFrom
    ? (STATUS_LABELS[cancelledFrom] ?? cancelledFrom)
    : null;
  const label =
    status === "cancelled" && fromLabel
      ? `${baseLabel} (era ${fromLabel})`
      : baseLabel;
  const className =
    STATUS_CLASSES[status] ?? "bg-border-soft text-muted-foreground";
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {showIcon && Icon && (
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      {label}
    </span>
  );
}
