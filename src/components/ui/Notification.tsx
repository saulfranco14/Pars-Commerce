"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NotificationTone = "success" | "error" | "warning" | "info";

interface NotificationProps {
  tone: NotificationTone;
  message: React.ReactNode;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

const TONE_CLASSES: Record<
  NotificationTone,
  { container: string; icon: string; iconColor: string; close: string }
> = {
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: "text-emerald-600",
    iconColor: "text-emerald-600",
    close: "text-emerald-600 hover:text-emerald-800",
  },
  error: {
    container: "border-red-200 bg-red-50 text-red-700",
    icon: "text-red-600",
    iconColor: "text-red-600",
    close: "text-red-600 hover:text-red-800",
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "text-amber-600",
    iconColor: "text-amber-600",
    close: "text-amber-600 hover:text-amber-800",
  },
  info: {
    container: "border-accent/30 bg-accent/5 text-foreground",
    icon: "text-accent",
    iconColor: "text-accent",
    close: "text-accent hover:opacity-80",
  },
};

const TONE_ICONS: Record<NotificationTone, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Canonical inline status banner used across QR / customer flows.
 * Replaces the dozen ad-hoc emerald/red `<div>` blocks duplicated around
 * the codebase. Pick a `tone` and pass a message. Optional dismiss button.
 */
export function Notification({
  tone,
  message,
  title,
  onDismiss,
  className = "",
}: NotificationProps) {
  const tones = TONE_CLASSES[tone];
  const Icon = TONE_ICONS[tone];

  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${tones.container} ${className}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tones.icon}`} aria-hidden />
      <div className="min-w-0 flex-1 text-sm font-medium">
        {title && <p className="font-bold">{title}</p>}
        <div className={title ? "mt-0.5 text-xs font-medium opacity-90" : ""}>
          {message}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar notificación"
          className={`shrink-0 cursor-pointer ${tones.close}`}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
