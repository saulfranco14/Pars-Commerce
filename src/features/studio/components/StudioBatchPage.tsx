"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LayoutGrid, Sparkles } from "lucide-react";
import { useStudioBatch } from "../hooks/useStudioBatch";
import { useStudioImages } from "../hooks/useStudioImages";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStudioContext } from "./StudioProvider";
import { StudioActionBar } from "./StudioActionBar";
import { StudioBatchProgress } from "./StudioBatchProgress";
import { StudioImageTile } from "./editor/StudioImageStrip";
import {
  adminActionButtonIcon,
  adminActionButtonPrimary,
} from "@/components/admin/actionButtonClasses";
import {
  STUDIO_ACTION_BAR_SPACE,
  STUDIO_BATCH_MAX,
  STUDIO_POSTER_STYLES,
  STUDIO_SCENES,
} from "../constants/studio";
import type { StudioBatchRequest } from "../interfaces/studio";

const TYPES = [
  { value: "product", label: "Productos" },
  { value: "promotion", label: "Promociones" },
  { value: "subscription_plan", label: "Planes" },
] as const;
const chip = (on: boolean) =>
  `min-h-10 cursor-pointer rounded-full border px-3 text-sm font-semibold transition-colors ${on ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface"}`;

export function StudioBatchPage() {
  const { tenantSlug, summary } = useStudioContext(),
    batch = useStudioBatch(),
    library = useStudioImages(),
    [mode, setMode] = useState<StudioBatchRequest["mode"]>("shared"),
    [assetId, setAssetId] = useState<string | null>(null),
    [template, setTemplate] =
      useState<StudioBatchRequest["template"]>("impact"),
    [scene, setScene] = useState<StudioBatchRequest["scene"]>("local");
  const base = `/dashboard/${tenantSlug}/studio`,
    count = batch.selected.length,
    balance = summary?.balance.available ?? 0,
    aiReady = Boolean(summary?.aiEnabled),
    cost = mode === "each" ? count : 0,
    ready =
      count > 0 &&
      (mode === "shared" ? Boolean(assetId) : aiReady && balance >= cost);
  if (batch.phase !== "pick")
    return (
      <div className="space-y-5">
        <PageHeader compact title="Varios productos" />
        <StudioBatchProgress
          phase={batch.phase}
          mode={batch.runMode}
          rows={batch.rows}
          imageStartedAt={batch.imageStartedAt}
          error={batch.error}
          base={base}
          onReset={batch.reset}
        />
      </div>
    );
  return (
    <div className={`space-y-5 ${STUDIO_ACTION_BAR_SPACE}`}>
      <PageHeader
        compact
        title="Varios productos"
        action={
          <Link
            href={base}
            className={adminActionButtonIcon}
            aria-label="Volver a Studio"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />
      <p className="text-sm text-muted-foreground">
        Un anuncio para cada uno, con el mismo estilo. La IA escribe la frase de
        cada producto, gratis.
      </p>
      <FilterTabs
        tabs={TYPES}
        activeValue={batch.sourceType}
        onTabChange={(value) =>
          batch.setSourceType(value as StudioBatchRequest["sourceType"])
        }
        ariaLabel="Qué vas a anunciar"
        density="touch"
      />
      <section className="space-y-2 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold">
            {count} de {Math.min(batch.items.length, STUDIO_BATCH_MAX)} elegidos
          </p>
          <button
            type="button"
            onClick={batch.selectAll}
            disabled={!batch.items.length}
            className="min-h-11 cursor-pointer text-sm font-bold text-accent"
          >
            {count ? "Ninguno" : "Todos"}
          </button>
        </div>
        <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {batch.loading ? (
            <>
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </>
          ) : batch.items.length ? (
            batch.items.map((item) => {
              const on = batch.selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => batch.toggle(item.id)}
                  className={`flex min-h-12 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm ${on ? "border-accent bg-accent/5" : "border-border"}`}
                >
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
                  >
                    {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                  </span>
                </button>
              );
            })
          ) : (
            <EmptyState
              icon={LayoutGrid}
              title="Todavía no hay nada aquí"
              description="Agrega productos o promociones a tu catálogo."
            />
          )}
        </div>
        {batch.items.length > STUDIO_BATCH_MAX && (
          <p className="text-xs text-muted-foreground">
            Hasta {STUDIO_BATCH_MAX} por tanda. Al terminar puedes hacer otra.
          </p>
        )}
      </section>
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-bold">Imagen</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {
              value: "shared" as const,
              title: "Una de tus imágenes",
              detail: "Todos con el mismo estilo",
              cost: "Gratis",
            },
            {
              value: "each" as const,
              title: "Una para cada producto",
              detail: "La IA pone cada uno en su escena",
              cost: `${count} ${count === 1 ? "Tlaco" : "Tlacos"}`,
            },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              disabled={option.value === "each" && !aiReady}
              onClick={() => setMode(option.value)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left disabled:opacity-50 ${mode === option.value ? "border-accent bg-accent/5" : "border-border"}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{option.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {option.detail}
                </span>
              </span>
              <span className="text-xs font-bold whitespace-nowrap text-accent">
                {option.cost}
              </span>
            </button>
          ))}
        </div>
        {mode === "shared" ? (
          library.images.length ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {library.images.map((image) => (
                <StudioImageTile
                  key={image.id}
                  disabled={false}
                  tile={{
                    key: image.id,
                    label: image.title || "Imagen",
                    url: image.url,
                    selected: assetId === image.id,
                    onPick: () => setAssetId(image.id),
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no tienes imágenes. Haz una desde cualquier anuncio con
              Generar, o elige “Una para cada producto”.
            </p>
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {STUDIO_SCENES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={scene === s.id}
                onClick={() => setScene(s.id)}
                className={chip(scene === s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        {mode === "each" && balance < cost && (
          <p className="text-sm text-muted-foreground">
            Te quedan {balance} Tlacos.{" "}
            <Link
              href={`${base}/tlacos`}
              className="font-semibold text-accent underline"
            >
              Recargar
            </Link>
          </p>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-sm font-bold">Estilo</h2>
        <div className="flex flex-wrap gap-2">
          {STUDIO_POSTER_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              aria-pressed={template === style.id}
              onClick={() =>
                setTemplate(style.id as StudioBatchRequest["template"])
              }
              className={chip(template === style.id)}
            >
              {style.name}
            </button>
          ))}
        </div>
      </section>
      <StudioActionBar
        status={
          mode === "each"
            ? `${count} anuncios · ${cost} ${cost === 1 ? "Tlaco" : "Tlacos"}`
            : `${count} anuncios · gratis`
        }
      >
        <button
          type="button"
          disabled={!ready}
          onClick={() =>
            void batch.start({
              mode,
              assetId: assetId ?? undefined,
              template,
              scene,
              quality: "economy",
            })
          }
          className={`${adminActionButtonPrimary} w-full md:w-auto`}
        >
          <Sparkles className="h-4 w-4" />
          Crear {count || ""}
        </button>
      </StudioActionBar>
    </div>
  );
}
