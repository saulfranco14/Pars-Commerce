"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";

import type { LeadOwnerSheetProps } from "@/features/growth/interfaces/leadActions";

const optionClass =
  "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-3 text-sm text-foreground has-checked:border-accent has-checked:bg-accent/5";

/** Who works this prospect; only they can write to it. */
export function LeadOwnerSheet({ isOpen, busy, ownerId, actorId, people, onClose, onSubmit }: LeadOwnerSheetProps) {
  const [selected, setSelected] = useState(ownerId ?? "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (await onSubmit(selected || null)) onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="¿Quién lo trabaja?"
      description="Solo esa persona le puede escribir."
      icon={UserRound}
      maxWidth="max-w-md"
      footer={<button type="submit" form="owner-form" disabled={busy || selected === (ownerId ?? "")} className={`${adminActionButtonPrimary} w-full`}>{busy ? "Guardando…" : "Guardar"}</button>}
    >
      <form id="owner-form" onSubmit={submit} className="grid gap-2">
        {people.map((member) => (
          <label key={member.user_id} className={optionClass}>
            <input type="radio" name="owner" value={member.user_id} checked={selected === member.user_id} onChange={() => setSelected(member.user_id)} className="h-4 w-4 accent-accent" />
            {member.user_id === actorId ? `Tú (${member.display_name})` : member.display_name}
          </label>
        ))}
        <label className={optionClass}>
          <input type="radio" name="owner" value="" checked={selected === ""} onChange={() => setSelected("")} className="h-4 w-4 accent-accent" />
          Nadie (el primero que le escriba)
        </label>
      </form>
    </FormSheet>
  );
}
