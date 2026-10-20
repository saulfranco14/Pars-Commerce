"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Loader2, Plus, RotateCcw, Tag } from "lucide-react";

import { useCartAdd } from "@/features/sitio/hooks/useCartAdd";

import { addPromotion } from "@/services/publicCartService";
import { storeFocusRing } from "@/features/sitio/constants/storeClasses";
import {
  formatPromotionDeadline,
  formatPromotionValue,
  isPromotionAddable,
} from "@/features/sitio/helpers/promotions";

import type { PromotionCardProps } from "@/features/sitio/interfaces/storeComponents";

const ADD_ICONS = { idle: Plus, adding: Loader2, added: Check, error: RotateCcw } as const;
const ADD_LABELS = { idle: "Agregar", adding: "Agregando…", added: "Agregada", error: "Reintentar" } as const;

export function PromotionCard({ promotion, tenantId, slug }: PromotionCardProps) {
  const href = `/sitio/${slug}/promociones/${promotion.slug || promotion.id}`;
  const deadline = formatPromotionDeadline(promotion.valid_until);
  const addable = isPromotionAddable(promotion);
  const { status, trigger, ready } = useCartAdd({
    add: (fingerprint) => addPromotion(tenantId, promotion.id, fingerprint),
    successLabel: `${promotion.name} se agregó al carrito`,
  });
  const AddIcon = ADD_ICONS[status];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-(--store-radius) bg-(--store-surface) ring-1 ring-(--store-hairline)">
      <div className="relative aspect-16/10 overflow-hidden bg-(--store-well)">
        {promotion.image_url ? (
          <Image
            src={promotion.image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <Tag className="h-10 w-10 text-(--store-ink-2) opacity-40" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-sm font-semibold text-(--store-ink-2)">{formatPromotionValue(promotion)}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-(--store-ink)">
          <Link
            href={href}
            className={`rounded-sm after:absolute after:inset-0 after:content-[''] ${storeFocusRing}`}
          >
            {promotion.name}
          </Link>
        </h3>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {deadline ? (
            <p className="flex items-center gap-1.5 text-[13px] text-(--store-ink-2)">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Hasta el {deadline}
            </p>
          ) : (
            <span />
          )}
          {addable ? (
            <button
              type="button"
              onClick={trigger}
              disabled={!ready || status === "adding"}
              className={`relative z-10 inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60 motion-safe:active:scale-[0.98] ${storeFocusRing}`}
            >
              <AddIcon className={`h-4 w-4 ${status === "adding" ? "animate-spin" : ""}`} aria-hidden />
              {ADD_LABELS[status]}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
