"use client";

import { useState } from "react";
import { Check, Monitor, Pencil, Trash2, WifiOff, X } from "lucide-react";

import { describeUserAgent } from "@/features/dispositivos/helpers/describeDevice";
import { formatOrderDate } from "@/lib/formatDate";

import type { DeviceRowProps } from "@/features/dispositivos/interfaces/devicesSection";

function state(device: DeviceRowProps["device"]) {
  if (device.status === "rejected") {
    return { label: "Rechazada", tone: "bg-red-100 text-red-700" };
  }
  if (!device.claimed_at) {
    return {
      label: "Aprobada, sin conectar",
      tone: "bg-amber-100 text-amber-700",
    };
  }
  return { label: "Activa", tone: "bg-emerald-100 text-emerald-700" };
}

export function DeviceRow({
  device,
  onRevoke,
  onDelete,
  onRename,
  busy,
}: DeviceRowProps) {
  const s = state(device);
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;

  function save() {
    const name = (draft ?? "").trim();
    if (name && name !== device.name) onRename(device, name);
    setDraft(null);
  }

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-border-soft/60 text-muted-foreground">
        <Monitor className="h-5 w-5" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft}
              autoFocus
              maxLength={60}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") setDraft(null);
              }}
              placeholder="Ej. Entrada, Caja 2"
              className="input-form min-h-11 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
              aria-label="Nombre de la pantalla"
            />
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
              aria-label="Guardar nombre"
            >
              <Check className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-border-soft/60"
              aria-label="Cancelar"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {device.name ?? "Sin nombre"}
            </p>
            <button
              type="button"
              onClick={() => setDraft(device.name ?? "")}
              className="inline-flex cursor-pointer items-center gap-1 rounded text-xs font-medium text-accent transition-colors hover:underline"
            >
              <Pencil className="h-3 w-3 shrink-0" aria-hidden />
              Renombrar
            </button>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}
            >
              {s.label}
            </span>
          </div>
        )}
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {describeUserAgent(device.user_agent)}
          {device.screen_info ? ` · ${device.screen_info}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {device.last_seen_at
            ? `Vista el ${formatOrderDate(device.last_seen_at)}`
            : "Todavía no se conecta"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {device.status === "approved" && (
          <button
            type="button"
            onClick={() => onRevoke(device)}
            disabled={busy}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-border-soft/60 disabled:opacity-50"
          >
            <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Revocar
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(device)}
          disabled={busy}
          className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          aria-label={`Eliminar ${device.name ?? "pantalla"}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}
