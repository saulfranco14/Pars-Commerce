"use client";
import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowRight, Store, WandSparkles } from "lucide-react";
import { useStudioBulkPublish } from "../hooks/useStudioBulkPublish";
import { EmptyState } from "@/components/admin/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";
import { StudioScenePreview } from "./editor/StudioScenePreview";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";
import { loadPlacements } from "../services/studioClientService";
import { STUDIO_AD_STATES } from "../constants/studio";
import type { StudioAdsSectionProps } from "../interfaces/ui";

/** The merchant's ads with where each one is, and one tap to put the finished ones in the store. */
export function StudioAdsSection({
  designs,
  base,
  tenantId,
  canPublish,
  onChanged,
}: StudioAdsSectionProps) {
  const placements = useSWR(
      canPublish ? ["studio-placements", tenantId] : null,
      () => loadPlacements(tenantId),
    ),
    [confirm, setConfirm] = useState(false),
    live = new Set(
      (placements.data ?? [])
        .filter((p) => p.is_active)
        .map((p) => p.design_id),
    ),
    stateOf = (id: string, status: string) =>
      live.has(id) ? "live" : status === "ready" ? "ready" : "unfinished",
    waiting = designs.filter(
      (d) =>
        canPublish &&
        d.source_type === "product" &&
        stateOf(d.id, d.status) === "ready",
    ),
    bulk = useStudioBulkPublish(() => {
      void placements.mutate();
      onChanged();
    });

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">Tus anuncios</h2>
        <Link
          href={`${base}/disenos`}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-accent"
        >
          Ver todos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {waiting.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-accent/25 bg-accent/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold">
            {waiting.length === 1
              ? "1 anuncio listo sin publicar"
              : `${waiting.length} anuncios listos sin publicar`}
          </p>
          <button
            type="button"
            className={`${adminActionButtonPrimary} w-full sm:w-auto`}
            disabled={Boolean(bulk.progress)}
            onClick={() => setConfirm(true)}
          >
            <Store className="h-4 w-4" />
            {bulk.progress
              ? `Publicando ${bulk.progress.done + 1} de ${bulk.progress.total}…`
              : "Publicar"}
          </button>
        </div>
      )}
      {bulk.error && (
        <Notification
          tone="warning"
          message={bulk.error}
          onDismiss={bulk.clearError}
        />
      )}
      {designs.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {designs.map((design) => {
            const state = STUDIO_AD_STATES[stateOf(design.id, design.status)];
            return (
              <Link
                key={design.id}
                href={`${base}/disenos/${design.id}`}
                className="flex min-w-0 flex-col gap-1.5"
              >
                <span className="pointer-events-none block overflow-hidden rounded-xl">
                  <StudioScenePreview
                    scene={design.draft_scene}
                    assets={[]}
                    tenantId={tenantId}
                  />
                </span>
                <span className="flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="truncate">{design.title}</span>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${state.tone}`}
                  >
                    {state.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={WandSparkles}
          title="Tu primer anuncio empieza con lo que ya vendes"
          description="En Catálogo toca Crear en un producto y te lo damos hecho."
        />
      )}
      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        title="Poner en tu tienda"
        description={`Cada uno será la foto principal de su producto: ${waiting.map((d) => d.title).join(", ")}. Puedes retirarlos cuando quieras.`}
        confirmLabel="Publicar"
        onConfirm={() => {
          setConfirm(false);
          void bulk.publish(waiting);
        }}
      />
    </section>
  );
}
