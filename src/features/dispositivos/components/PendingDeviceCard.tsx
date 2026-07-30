"use client";

import { Check, Monitor, X } from "lucide-react";

import { describeUserAgent } from "@/features/dispositivos/helpers/describeDevice";
import { formatOrderDate } from "@/lib/formatDate";

import type { PendingDeviceCardProps } from "@/features/dispositivos/interfaces/devicesSection";

export function PendingDeviceCard({
  device,
  onApprove,
  onReject,
  busy,
}: PendingDeviceCardProps) {
  return (
    <li className="rounded-xl border-2 border-accent/40 bg-accent/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0 rounded-xl border border-border bg-surface px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Código en pantalla
          </p>
          <p className="font-mono text-3xl font-bold tracking-[0.2em] text-accent">
            {device.enroll_code}
          </p>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Monitor
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <p className="text-sm font-semibold text-foreground">
              {describeUserAgent(device.user_agent)}
            </p>
          </div>
          {device.screen_info && (
            <p className="text-xs text-muted-foreground">
              Pantalla de {device.screen_info}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Pidió permiso el {formatOrderDate(device.requested_at)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onApprove(device)}
          disabled={busy}
          className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          Sí, es mi pantalla
        </button>
        <button
          type="button"
          onClick={() => onReject(device)}
          disabled={busy}
          className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/60 disabled:opacity-50"
        >
          <X className="h-4 w-4 shrink-0" aria-hidden />
          Rechazar
        </button>
      </div>
    </li>
  );
}
