"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnWorkPrimary, btnWorkSecondary } from "@/components/ui/buttonClasses";

import { roleLabel } from "@/features/equipo/constants/roleDescriptions";
import { roleNameError } from "@/features/equipo/helpers/rolePermissions";

import type { NewRoleSheetProps } from "@/features/equipo/interfaces/roleEditor";

const fieldLabel = "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground";
const fieldInput =
  "input-form min-h-11 w-full rounded-xl border px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

export function NewRoleSheet({ isOpen, roles, onClose, onCreate }: NewRoleSheetProps) {
  const [name, setName] = useState("");
  const [baseId, setBaseId] = useState("");
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameError = touched ? roleNameError(name) : null;
  const bases = roles.filter((r) => r.name !== "owner");

  function close() {
    setName("");
    setBaseId("");
    setTouched(false);
    onClose();
  }

  async function submit() {
    setTouched(true);
    if (roleNameError(name)) return;
    setSaving(true);
    const base = bases.find((r) => r.id === baseId);
    const ok = await onCreate(name.trim(), base?.permissions ?? []);
    setSaving(false);
    if (ok) close();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={close}
      icon={Plus}
      title="Nuevo rol"
      description="Ponle nombre y, si quieres, parte de uno que ya existe. Luego ajustas sus permisos."
      maxWidth="max-w-md"
      dismissible={!saving}
      footer={
        <div className="flex flex-col gap-2">
          <button type="submit" form="new-role-form" disabled={saving} className={`${btnWorkPrimary} w-full`}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
            Crear rol
          </button>
          <button type="button" onClick={close} className={`${btnWorkSecondary} w-full`}>
            Cancelar
          </button>
        </div>
      }
    >
      <form
        id="new-role-form"
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div>
          <label htmlFor="new-role-name" className={fieldLabel}>
            Nombre
          </label>
          <input
            id="new-role-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setTouched(true);
            }}
            placeholder="Turno noche, Encargado…"
            className={fieldInput}
            aria-invalid={Boolean(nameError)}
          />
          {nameError && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{nameError}</p>}
        </div>
        <div>
          <label htmlFor="new-role-base" className={fieldLabel}>
            Partir de
          </label>
          <select id="new-role-base" value={baseId} onChange={(e) => setBaseId(e.target.value)} className={`select-custom ${fieldInput}`}>
            <option value="">Sin permisos</option>
            {bases.map((r) => (
              <option key={r.id} value={r.id}>
                {roleLabel(r.name)}
              </option>
            ))}
          </select>
        </div>
      </form>
    </FormSheet>
  );
}
