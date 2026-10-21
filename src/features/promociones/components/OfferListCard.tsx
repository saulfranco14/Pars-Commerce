"use client";

import Image from "next/image";
import { Archive, Copy, ExternalLink, Pause, Pencil, Play, Tag } from "lucide-react";

import { AdminListCard } from "@/components/admin/AdminListCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionsMenu, type ActionsMenuItem } from "@/components/ui/ActionsMenu";

import { formatOfferDeadline, formatOfferLabel } from "@/lib/offers/formatOfferLabel";
import { OFFER_STATUS_META } from "@/features/promociones/helpers/offerStatus";

import type { OfferListEntry } from "@/features/promociones/hooks/useOffersList";

function scopeLabel(entry: OfferListEntry): string {
  const promotion = entry.promotion;
  if (promotion.type === "bundle_price") {
    const count = promotion.bundle_product_ids?.length ?? 0;
    return `${count} ${count === 1 ? "producto" : "productos"} en el paquete`;
  }
  if (promotion.applies_to === "all") return "Toda la tienda";
  if (promotion.applies_to === "subcatalogs") {
    const count = promotion.subcatalog_ids?.length ?? 0;
    return `${count} ${count === 1 ? "categoría" : "categorías"}`;
  }
  const count = promotion.product_ids?.length ?? 0;
  return count === 0 ? "Sin productos" : `${count} ${count === 1 ? "producto" : "productos"}`;
}

interface OfferListCardProps {
  entry: OfferListEntry;
  /** First product photo, shown when the promotion has no image of its own. */
  previewImage: string | null;
  storeUrl: string | null;
  busy: boolean;
  onEdit: () => void;
  onPause: () => void;
  onActivate: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
}

export function OfferListCard({ entry, previewImage, storeUrl, busy, onEdit, onPause, onActivate, onDuplicate, onArchive }: OfferListCardProps) {
  const { promotion, status } = entry;
  const meta = OFFER_STATUS_META[status];
  const deadline = formatOfferDeadline(promotion.valid_until);
  const isRunning = status === "active" || status === "scheduled";

  const items: ActionsMenuItem[] = [
    { label: "Editar", icon: Pencil, onClick: onEdit },
    isRunning
      ? { label: "Pausar", icon: Pause, onClick: onPause, disabled: busy }
      : { label: status === "expired" ? "Activar (revisa las fechas)" : "Activar", icon: Play, onClick: onActivate, disabled: busy },
    { label: "Duplicar", icon: Copy, onClick: onDuplicate, disabled: busy },
    ...(storeUrl && status === "active" ? [{ label: "Ver en tienda", icon: ExternalLink, onClick: () => window.open(storeUrl, "_blank", "noopener") }] : []),
    { label: "Archivar", icon: Archive, onClick: onArchive, danger: true, disabled: busy },
  ];

  return (
    <AdminListCard
      title={promotion.name}
      thumbnail={
        <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-accent/10">
          {promotion.image_url || previewImage ? (
            <Image src={(promotion.image_url || previewImage) as string} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <Tag className="h-6 w-6 text-accent" aria-hidden />
          )}
        </span>
      }
      meta={
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">{formatOfferLabel(promotion)}</span>
          <span>
            {scopeLabel(entry)}
            {deadline ? ` · hasta el ${deadline}` : ""}
          </span>
        </span>
      }
      badge={<StatusBadge tone={meta.tone} label={meta.label} />}
      actions={
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-semibold text-accent hover:bg-accent/10"
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Editar
          </button>
          <ActionsMenu items={items} aria-label={`Acciones de ${promotion.name}`} />
        </div>
      }
    />
  );
}
