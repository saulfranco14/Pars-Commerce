"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Coins,
  LayoutGrid,
  Plus,
  WandSparkles,
} from "lucide-react";
import { useStudioContinuation } from "../hooks/useStudioContinuation";
import { useStudioImages } from "../hooks/useStudioImages";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Notification } from "@/components/ui/Notification";
import { useStudioContext } from "./StudioProvider";
import { StudioLoading } from "./StudioLoading";
import { StudioPendingBanner } from "./StudioPendingBanner";
import { StudioUseImageSheet } from "./StudioUseImageSheet";
import { StudioScenePreview } from "./editor/StudioScenePreview";
import { StudioImagesSheet } from "./editor/StudioImagesSheet";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import type { StudioImage } from "../interfaces/studio";

export function StudioHome() {
  useStudioContinuation();
  const { tenantId, tenantSlug, summary, isLoading, error, refresh } =
      useStudioContext(),
    library = useStudioImages(),
    [using, setUsing] = useState<StudioImage | null>(null),
    [allOpen, setAllOpen] = useState(false);
  const base = `/dashboard/${tenantSlug}/studio`;
  if (isLoading) return <StudioLoading />;
  if (error || !summary)
    return (
      <Notification
        tone="error"
        message={error?.message ?? "No pudimos cargar Studio."}
      />
    );
  const canCreate =
    summary.enabled && summary.permissions.includes("studio.create");
  const tiles = library.images.map((image) => ({
    key: image.id,
    label: image.title || "Imagen",
    url: image.url,
    selected: false,
    onPick: () => setUsing(image),
  }));
  return (
    <div className="space-y-6">
      <PageHeader
        compact
        title="Studio"
        action={
          <Link
            href={`${base}/tlacos`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent/10 px-3 text-sm font-bold text-accent"
          >
            <Coins className="h-4 w-4" aria-hidden />
            {summary.balance.available} Tlacos
          </Link>
        }
      />
      {canCreate && (
        <div className={actionPair}>
          <Link href={`${base}/varios`} className={adminActionButtonSecondary}>
            <LayoutGrid className="h-4 w-4" />
            Varios productos
          </Link>
          <Link href={`${base}/nuevo`} className={adminActionButtonPrimary}>
            <Plus className="h-4 w-4" />
            Crear
          </Link>
        </div>
      )}
      {summary.membership?.ai_blocked && (
        <Notification
          tone="warning"
          message="Hay un pago en revisión. Las imágenes con IA están pausadas y tu contenido se conserva."
        />
      )}
      {!summary.enabled && (
        <Notification
          tone="info"
          message="La creación está temporalmente no disponible. Puedes consultar tu biblioteca y descargar tus archivos."
        />
      )}
      <StudioPendingBanner onFinished={() => void library.refresh()} />
      <section className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">Tus imágenes</h2>
          {library.images.length > 0 && (
            <button
              type="button"
              onClick={() => setAllOpen(true)}
              className="min-h-11 cursor-pointer text-sm font-semibold text-accent"
            >
              Ver todas ({library.images.length})
            </button>
          )}
        </div>
        {library.images.length ? (
          <div className="flex snap-x gap-3 overflow-x-auto pr-10 pb-2 mask-[linear-gradient(90deg,#000_85%,transparent)]">
            {library.images.slice(0, 12).map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setUsing(image)}
                className="flex w-28 shrink-0 cursor-pointer snap-start flex-col gap-1 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <span className="truncate text-xs text-muted-foreground">
                  {image.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-border-soft/60 p-4 text-sm text-muted-foreground">
            Aquí aparecen las imágenes que hagas con la IA. Puedes usarlas en
            cualquier producto, promoción o combo.
          </p>
        )}
      </section>
      <section className="space-y-2">
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
        {summary.recent.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {summary.recent.map((design) => (
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
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${design.status === "ready" ? "bg-emerald-500/10 text-emerald-600" : "bg-border-soft text-muted-foreground"}`}
                  >
                    {design.status === "ready" ? "Listo" : "Borrador"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={WandSparkles}
            title="Tu primer anuncio empieza con lo que ya vendes"
            description="Toca Crear, elige un producto y te lo damos hecho."
          />
        )}
      </section>
      <StudioImagesSheet
        open={allOpen}
        onClose={() => setAllOpen(false)}
        disabled={false}
        tiles={tiles}
      />
      <StudioUseImageSheet
        image={using}
        onClose={() => {
          setUsing(null);
          void refresh();
        }}
      />
    </div>
  );
}
