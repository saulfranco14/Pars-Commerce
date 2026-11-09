"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Globe, RefreshCw, Unplug } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Notification } from "@/components/ui/Notification";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { STUDIO_SURFACES } from "../constants/studio";
import {
  loadPlacements,
  removePlacement,
} from "../services/studioClientService";
import { useStudioContext } from "./StudioProvider";
import { StudioLoading } from "./StudioLoading";

export function StudioPublicationList() {
  const { tenantId, tenantSlug, summary } = useStudioContext(),
    [selected, setSelected] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const {
    data,
    isLoading,
    mutate,
    error: loadError,
  } = useSWR(["studio-placements", tenantId], () => loadPlacements(tenantId));
  async function remove() {
    if (!selected) return;
    setBusy(true);
    try {
      await removePlacement(tenantId, selected);
      await mutate();
      setSelected(null);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos retirar el anuncio.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader
        title="Publicaciones en Tlaco"
        description="Cada anuncio conserva su versión, destino y vigencia. Compartir en redes se registra por separado."
        action={
          <button
            className={adminActionButtonSecondary}
            onClick={() => void mutate()}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
        }
      />
      {(error || loadError) && (
        <Notification
          tone="error"
          message={error ?? "No pudimos consultar las publicaciones."}
        />
      )}{" "}
      {isLoading ? (
        <StudioLoading />
      ) : data?.length ? (
        <div className="space-y-3">
          {data.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold">{row.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {STUDIO_SURFACES[row.surface]?.label} ·{" "}
                    {!row.is_active
                      ? row.disabled_reason === "source_changed"
                        ? "Suspendida: cambió el catálogo"
                        : row.disabled_reason === "expired"
                          ? "Vencida"
                          : row.disabled_reason === "replaced"
                            ? "Reemplazada"
                            : "Retirada"
                      : row.ends_at && new Date(row.ends_at) <= new Date()
                        ? "Vencida"
                        : new Date(row.starts_at) > new Date()
                          ? "Programada por vigencia"
                          : "Aplicada · sujeta al catálogo vigente"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Desde {new Date(row.starts_at).toLocaleString("es-MX")}
                    {row.ends_at
                      ? ` · hasta ${new Date(row.ends_at).toLocaleString("es-MX")}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className={adminActionButtonSecondary}
                    href={`/dashboard/${tenantSlug}/studio/disenos/${row.design_id}`}
                  >
                    <Globe className="h-4 w-4" />
                    Ver diseño
                  </Link>
                  {row.is_active &&
                    summary?.permissions.includes("studio.publish") && (
                      <button
                        className={adminActionButtonSecondary}
                        onClick={() => setSelected(row.id)}
                      >
                        <Unplug className="h-4 w-4" />
                        Retirar
                      </button>
                    )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Globe}
          title="Tus anuncios aún no están aplicados"
          description="Después de revisar un diseño puedes elegir sitio, mesas o cada superficie compatible."
        />
      )}
      <ConfirmDialog
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        onConfirm={remove}
        loading={busy}
        title="Retirar este anuncio"
        description="La superficie volverá a su contenido original. El diseño y sus archivos se conservan."
        confirmLabel="Retirar anuncio"
      />
    </div>
  );
}
