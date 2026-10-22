"use client";

import { CheckCircle2, Clock3, MapPin, Pencil } from "lucide-react";

import { describeWeek } from "@/features/configuracion/helpers/businessHours";

import type { PickupPointCardProps } from "@/features/configuracion/interfaces/paymentsAndDelivery";

export function PickupPointCard({ point, isMain, globalHours, onEdit, onRemove }: PickupPointCardProps) {
  const hours = point.business_hours ?? globalHours;
  const schedule = hours ? describeWeek(hours)[0] : "Horario por confirmar";
  return (
    <article className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <MapPin className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold text-foreground">{point.name}</p>
            {isMain ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Principal</span> : null}
            {point.mapbox_feature_id ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Mapa
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {point.address_text}
            {point.reference ? ` · ${point.reference}` : ""}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Clock3 className="h-3.5 w-3.5 text-accent" aria-hidden />
            {schedule}
            <span className="font-normal text-muted-foreground">· {point.business_hours ? "Propio" : "General"}</span>
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onEdit} className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-foreground">
          <Pencil className="h-4 w-4" aria-hidden />
          Editar
        </button>
        <button type="button" onClick={onRemove} className="min-h-11 cursor-pointer rounded-xl border border-red-200 text-sm font-bold text-red-600">
          Quitar
        </button>
      </div>
    </article>
  );
}
