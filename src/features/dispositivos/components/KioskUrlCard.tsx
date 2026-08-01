"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, Copy, Link2, RefreshCw } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";
import {
  getEnrollUrlKey,
  rotateEnrollUrlKey,
} from "@/features/dispositivos/services/deviceClientService";

import type { KioskUrlCardProps } from "@/features/dispositivos/interfaces/devicesSection";

export function KioskUrlCard({ tenantId }: KioskUrlCardProps) {
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, mutate } = useSWR(["enroll-key", tenantId], () =>
    getEnrollUrlKey(tenantId),
  );

  const url =
    data && typeof window !== "undefined"
      ? `${window.location.origin}/kiosco/${data.slug}?k=${data.key}`
      : "";

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Sin permiso de portapapeles: se selecciona para copiar a mano.
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function rotate() {
    setRotating(true);
    setError(null);
    try {
      await rotateEnrollUrlKey(tenantId);
      await mutate();
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar");
    } finally {
      setRotating(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-border-soft/30 p-3">
        <div className="flex items-center gap-2">
          <Link2
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Abre esta dirección en la pantalla
          </p>
        </div>

        <p className="mt-1 break-all font-mono text-sm text-foreground">
          {url || "Generando…"}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            disabled={!url}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                Copiada
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 shrink-0" aria-hidden />
                Copiar dirección
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={!url || rotating}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/60 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
            Cambiar dirección
          </button>
        </div>
      </div>

      {error && <Notification tone="error" message={error} />}

      <p className="text-xs text-muted-foreground">
        La dirección lleva una clave: sin ella, nadie puede ni pedir permiso
        aunque conozca el nombre de tu negocio. Trátala como una contraseña.
      </p>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={rotate}
        title="¿Cambiar la dirección?"
        description="La dirección actual deja de servir. Las pantallas ya aprobadas siguen funcionando, pero cualquier link que hayas guardado o impreso habrá que reemplazarlo."
        confirmLabel="Sí, cambiarla"
        variant="danger"
        loading={rotating}
      />
    </div>
  );
}
