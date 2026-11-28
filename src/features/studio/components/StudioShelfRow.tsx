"use client";
import { useState } from "react";
import Link from "next/link";
import { ImageOff, Loader2, Plus } from "lucide-react";
import { StudioScenePreview } from "./editor/StudioScenePreview";
import {
  STUDIO_AD_STATES,
  STUDIO_SHARP_PHOTO_PX,
  STUDIO_SHELF_GAP_LABELS,
  STUDIO_SHELF_KIND_LABELS,
  STUDIO_SHELF_STATE_LABELS,
} from "../constants/studio";
import type { StudioShelfRowProps } from "../interfaces/ui";

const ROW =
  "flex min-h-18 w-full cursor-pointer items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** One catalog item. Without an ad the whole row is Crear; with one it opens that ad. */
export function StudioShelfRow({
  item,
  tenantId,
  adHref,
  creating,
  disabled,
  onCreate,
}: StudioShelfRowProps) {
  const [small, setSmall] = useState(false);
  if (item.ad && adHref) {
    const chip = STUDIO_AD_STATES[item.ad.state];
    return (
      <Link
        href={adHref}
        aria-label={`Abrir el anuncio de ${item.name}`}
        className={`${ROW} border-transparent bg-border-soft/60 hover:bg-border-soft`}
      >
        <span className="pointer-events-none block w-14 shrink-0 overflow-hidden rounded-xl">
          <StudioScenePreview
            scene={item.ad.scene}
            assets={[]}
            tenantId={tenantId}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">{item.name}</span>
          <span
            className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-bold ${chip.tone}`}
          >
            {chip.label}
          </span>
        </span>
        <span className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-border bg-surface px-3.5 text-sm font-bold">
          {item.ad.state === "unfinished" ? "Seguir" : "Abrir"}
        </span>
      </Link>
    );
  }
  const tags = [
    ...item.gaps.map((gap) => STUDIO_SHELF_GAP_LABELS[gap]),
    ...(small ? ["Foto chica"] : []),
    ...(item.state === "active" ? [] : [STUDIO_SHELF_STATE_LABELS[item.state]]),
  ];
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={disabled}
      aria-label={`Crear anuncio de ${item.name}`}
      className={`${ROW} border-border bg-surface hover:border-accent/50 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-border-soft text-muted-foreground">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onLoad={(e) =>
              setSmall(
                Math.min(
                  e.currentTarget.naturalWidth,
                  e.currentTarget.naturalHeight,
                ) < STUDIO_SHARP_PHOTO_PX,
              )
            }
          />
        ) : (
          <ImageOff className="h-5 w-5" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{item.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {STUDIO_SHELF_KIND_LABELS[item.kind]} ·{" "}
          {item.priceLabel || "sin precio"}
        </span>
        {tags.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400"
              >
                {tag}
              </span>
            ))}
          </span>
        )}
      </span>
      <span className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-accent px-3.5 text-sm font-bold text-accent-foreground">
        {creating ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Plus className="h-4 w-4" aria-hidden />
        )}
        {creating ? "Creando…" : "Crear"}
      </span>
    </button>
  );
}
