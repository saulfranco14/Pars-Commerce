"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { useStudioContinuation } from "../hooks/useStudioContinuation";
import { useStudioImages } from "../hooks/useStudioImages";
import { PageHeader } from "@/components/admin/PageHeader";
import { Notification } from "@/components/ui/Notification";
import { useStudioContext } from "./StudioProvider";
import { StudioLoading } from "./StudioLoading";
import { StudioPendingBanner } from "./StudioPendingBanner";
import { StudioAdsSection } from "./StudioAdsSection";
import { StudioShelf } from "./StudioShelf";
import { StudioUseImageSheet } from "./StudioUseImageSheet";
import { StudioImagesSheet } from "./editor/StudioImagesSheet";
import { STUDIO_HOME_TABS } from "../constants/studio";
import type { StudioImage } from "../interfaces/studio";
import type { StudioHomeTab } from "../interfaces/ui";

export function StudioHome() {
  useStudioContinuation();
  const { tenantId, tenantSlug, summary, isLoading, error, refresh } =
      useStudioContext(),
    library = useStudioImages(),
    [using, setUsing] = useState<StudioImage | null>(null),
    [allOpen, setAllOpen] = useState(false),
    [tab, setTab] = useState<StudioHomeTab>("catalog");
  const base = `/dashboard/${tenantSlug}/studio`;
  // Back from an ad, the list shows what was just published or finished.
  useEffect(() => {
    void refresh();
    // Once per visit to Studio's home.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
        <div
          className="grid grid-cols-2 gap-1 rounded-xl bg-border-soft/70 p-1"
          role="group"
          aria-label="Qué ver"
        >
          {STUDIO_HOME_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-10 cursor-pointer rounded-lg text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-accent ${tab === t.id ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {t.label}
            </button>
          ))}
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
      {canCreate && tab === "catalog" ? (
        <StudioShelf />
      ) : (
        <>
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
                Aquí aparecen las imágenes que hagas con la IA. Puedes usarlas
                en cualquier producto, promoción o combo.
              </p>
            )}
          </section>
          <StudioAdsSection
            designs={summary.recent}
            base={base}
            tenantId={tenantId}
            canPublish={Boolean(
              summary.publishEnabled &&
              summary.permissions.includes("studio.publish"),
            )}
            onChanged={() => void refresh()}
          />
        </>
      )}
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
