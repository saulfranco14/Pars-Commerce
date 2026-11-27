"use client";
import { useState } from "react";
import { useStudioImages } from "../hooks/useStudioImages";
import { useStudioContext } from "./StudioProvider";
import { StudioUseImageSheet } from "./StudioUseImageSheet";
import { StudioImagesSheet } from "./editor/StudioImagesSheet";
import type { StudioImage } from "../interfaces/studio";

/** The AI images made so far, ready to use on any product, promotion or combo. */
export function StudioYourImages() {
  const { refresh } = useStudioContext(),
    library = useStudioImages(),
    [using, setUsing] = useState<StudioImage | null>(null),
    [allOpen, setAllOpen] = useState(false);
  const tiles = library.images.map((image) => ({
    key: image.id,
    label: image.title || "Imagen",
    url: image.url,
    selected: false,
    onPick: () => setUsing(image),
  }));
  return (
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
    </section>
  );
}
