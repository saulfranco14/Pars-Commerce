import Image from "next/image";
import { Tag } from "lucide-react";

import type { PromotionCollageProps } from "@/features/promociones/interfaces/promotionVisual";

// Where each photo sits for 1, 2 or 3 photos: a fanned stack on the right, label below-left.
const SLOTS: Record<number, string[]> = {
  1: ["right-[8%] top-[10%] w-5/12 rotate-3"],
  2: ["right-[30%] top-[8%] w-1/3 -rotate-6", "right-[6%] top-[18%] w-5/12 rotate-3"],
  3: ["right-[40%] top-[16%] w-1/4 -rotate-6", "right-[20%] top-[6%] w-1/3 rotate-2", "right-[4%] top-[22%] w-1/4 rotate-6"],
};

/** A promotion's visual built from its own products when the merchant didn't upload one. */
export function PromotionCollage({ images, kicker, label }: PromotionCollageProps) {
  const photos = images.slice(0, 3);
  const slots = SLOTS[photos.length] ?? [];

  return (
    <div className="relative h-full w-full overflow-hidden bg-accent">
      <span aria-hidden className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <span aria-hidden className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-black/10" />

      {photos.length === 0 ? (
        <span aria-hidden className="absolute right-[10%] top-1/2 flex -translate-y-1/2 rotate-6 items-center justify-center rounded-3xl bg-white/15 p-6">
          <Tag className="h-16 w-16 text-white/80" />
        </span>
      ) : (
        photos.map((src, index) => (
          <span
            key={src}
            aria-hidden
            className={`absolute aspect-square overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/25 ring-4 ring-white ${slots[index]} ${
              index === 1 && photos.length === 3 ? "z-2" : "z-1"
            }`}
          >
            <Image src={src} alt="" fill sizes="(max-width: 640px) 40vw, 200px" className="object-cover" />
          </span>
        ))
      )}

      <div className="absolute bottom-3 left-3 z-10 max-w-[70%] rounded-2xl bg-white px-4 py-3 text-neutral-950 shadow-lg shadow-black/15 sm:bottom-4 sm:left-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{kicker}</p>
        <p className="text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{label}</p>
      </div>
    </div>
  );
}
