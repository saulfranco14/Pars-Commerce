"use client";

import Image from "next/image";
import { Archive, ExternalLink, Pause, Pencil, Play, Repeat } from "lucide-react";

import { AdminListCard } from "@/components/admin/AdminListCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionsMenu, type ActionsMenuItem } from "@/components/ui/ActionsMenu";

import { OFFER_STATUS_META } from "@/features/promociones/helpers/offerStatus";
import { planPriceLabel } from "@/features/suscripciones/helpers/planSubscriptionView";

import type { OfferPlan } from "@/features/planes/interfaces/offerPlan";

interface PlanListCardProps {
  plan: OfferPlan;
  storeUrl: string | null;
  busy: boolean;
  onEdit: () => void;
  onPause: () => void;
  onActivate: () => void;
  onArchive: () => void;
}

export function PlanListCard({ plan, storeUrl, busy, onEdit, onPause, onActivate, onArchive }: PlanListCardProps) {
  const meta = OFFER_STATUS_META[plan.status];
  const pieces = (plan.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
  const subscribers = plan.active_count ?? 0;

  const items: ActionsMenuItem[] = [
    { label: "Editar", icon: Pencil, onClick: onEdit },
    plan.status === "active"
      ? { label: "Pausar", icon: Pause, onClick: onPause, disabled: busy }
      : { label: "Activar", icon: Play, onClick: onActivate, disabled: busy },
    ...(storeUrl && plan.status === "active" ? [{ label: "Ver en tienda", icon: ExternalLink, onClick: () => window.open(storeUrl, "_blank", "noopener") }] : []),
    { label: "Archivar", icon: Archive, onClick: onArchive, danger: true, disabled: busy },
  ];

  return (
    <AdminListCard
      title={plan.name}
      thumbnail={
        <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-accent/10">
          {plan.image_url ? (
            <Image src={plan.image_url} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <Repeat className="h-6 w-6 text-accent" aria-hidden />
          )}
        </span>
      }
      meta={
        <span className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">{planPriceLabel(plan)}</span>
          <span>
            {pieces} {pieces === 1 ? "pieza" : "piezas"} por periodo · {subscribers} {subscribers === 1 ? "suscrito" : "suscritos"}
            {plan.max_active_members ? ` de ${plan.max_active_members}` : ""}
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
          <ActionsMenu items={items} aria-label={`Acciones de ${plan.name}`} />
        </div>
      }
    />
  );
}
