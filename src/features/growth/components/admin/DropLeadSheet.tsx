"use client";

import { useState } from "react";
import { UserX } from "lucide-react";

import { adminActionButtonDanger } from "@/components/admin/actionButtonClasses";
import { FormSheet } from "@/components/ui/FormSheet";

import { DROP_REASONS } from "@/features/growth/constants/dropReasons";

import type { DropLeadSheetProps, DropReason } from "@/features/growth/interfaces/cleanup";

/** Drop one prospect saying why; the reason stays on the lead so the team learns from it. */
export function DropLeadSheet({ isOpen, businessName, busy, onClose, onConfirm }: DropLeadSheetProps) {
  const [reason, setReason] = useState<DropReason>("rechazo");

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      icon={UserX}
      title={`Dar de baja a ${businessName}`}
      description="No se le vuelve a escribir por WhatsApp ni por correo, y sale de las listas de todo el equipo."
      dismissible={!busy}
      footer={
        <button type="button" disabled={busy} onClick={() => void onConfirm(reason)} className={`${adminActionButtonDanger} w-full`}>
          <UserX className="h-4 w-4" aria-hidden />Sí, dar de baja
        </button>
      }
    >
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold text-foreground">¿Por qué?</legend>
        {DROP_REASONS.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${reason === option.value ? "border-accent bg-accent/5" : "border-border hover:bg-border-soft/30"}`}
          >
            <input type="radio" name="drop-reason" value={option.value} checked={reason === option.value} onChange={() => setReason(option.value)} className="mt-1 h-4 w-4 accent-accent" />
            <span className="grid gap-0.5">
              <span className="text-sm font-semibold text-foreground">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </FormSheet>
  );
}
