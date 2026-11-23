"use client";
import { ImageIcon, Sparkles } from "lucide-react";
import type {
  StudioImageStripProps,
  StudioImageTileProps,
} from "../../interfaces/ui";

export function StudioImageTile({
  tile,
  disabled,
  size = "h-16 w-16",
}: StudioImageTileProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={tile.selected}
      onClick={tile.onPick}
      className="flex shrink-0 cursor-pointer snap-start flex-col items-center gap-1 rounded-xl text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        className={`relative block overflow-hidden rounded-xl border-2 bg-border-soft ${size} ${tile.selected ? "border-accent" : "border-muted/50"}`}
      >
        {tile.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tile.url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageIcon className="m-auto h-full w-6 text-muted-foreground" />
        )}
        {tile.badge && (
          <span className="absolute top-1 right-1 rounded-md bg-surface px-1 text-[9px] font-bold text-accent">
            {tile.badge}
          </span>
        )}
      </span>
      <span className="max-w-16 truncate">{tile.label}</span>
    </button>
  );
}

export function StudioImageStrip({
  tiles,
  disabled,
  onGenerate,
  onSeeAll,
}: StudioImageStripProps) {
  const saved = tiles.filter((t) => t.badge).length;
  return (
    <section className="min-w-0 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">Imagen</h2>
        {saved ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="min-h-6 cursor-pointer text-xs font-bold text-accent"
          >
            Ver todas ({saved})
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">
            Las que generes se guardan
          </span>
        )}
      </div>
      <div className="-mx-1 flex snap-x scroll-px-1 gap-2 overflow-x-auto px-1 pt-1 pb-1.5 [scrollbar-width:thin]">
        <button
          type="button"
          disabled={disabled}
          onClick={onGenerate}
          className="flex shrink-0 cursor-pointer snap-start flex-col items-center gap-1 rounded-xl text-[11px] font-bold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-accent/65 bg-accent/10">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          Generar
        </button>
        {tiles.map((tile, i) => (
          <div key={tile.key} className="flex shrink-0 gap-2">
            {i > 0 && !tile.badge && tiles[i - 1]?.badge === "Tuya" && (
              <span aria-hidden className="mb-5 w-px bg-border" />
            )}
            <StudioImageTile tile={tile} disabled={disabled} />
          </div>
        ))}
      </div>
    </section>
  );
}
