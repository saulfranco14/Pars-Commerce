"use client";

import { useState } from "react";
import { Filter, Search, X } from "lucide-react";

import { adminActionButtonPrimary, adminActionButtonSecondary, adminActionButtonText } from "@/components/admin/actionButtonClasses";
import { FormSheet } from "@/components/ui/FormSheet";

import { GIRO_COPY, GIRO_KEYS, giroCopy } from "@/features/growth/constants/giroCopy";
import { ZONES, zoneByMunicipio } from "@/features/growth/constants/zoneCopy";

import type { LeadContactFilter, LeadFilters } from "@/features/growth/interfaces/lead";
import type { ProspectsToolbarProps } from "@/features/growth/interfaces/prospects";

const selectClass = "input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const labelClass = "grid gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground";

const CONTACT_LABEL: Record<LeadContactFilter, string> = {
  whatsapp: "Con WhatsApp",
  correo: "Con correo",
  ambos: "Con WhatsApp y correo",
  sin: "Sin teléfono ni correo",
};

type Draft = Pick<LeadFilters, "owner" | "municipio" | "giro" | "contact">;

/** Search by name or phone plus «Filtros» with every field named; what is on shows as a chip with ✕. */
export function ProspectsToolbar({ filters, search, onSearch, onChange, onClear, isCoordinator, people }: ProspectsToolbarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const showContact = filters.vista === "contactar";
  const ownerLabel = (owner: string) => (owner === "me" ? "Yo" : owner === "none" ? "Nadie todavía" : people.find((member) => member.user_id === owner)?.display_name ?? "Otra persona");

  const chips = [
    isCoordinator && filters.owner ? { key: "owner" as const, label: `Lo trabaja: ${ownerLabel(filters.owner)}` } : null,
    filters.municipio ? { key: "municipio" as const, label: `Municipio: ${zoneByMunicipio(filters.municipio)?.label ?? filters.municipio}` } : null,
    filters.giro ? { key: "giro" as const, label: `Giro: ${giroCopy(filters.giro).label}` } : null,
    showContact && filters.contact ? { key: "contact" as const, label: CONTACT_LABEL[filters.contact] } : null,
  ].filter((chip): chip is { key: keyof Draft; label: string } => chip !== null);

  function openSheet() {
    setDraft({ owner: filters.owner, municipio: filters.municipio, giro: filters.giro, contact: filters.contact });
    setOpen(true);
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <label className="relative block min-w-0">
          <span className="sr-only">Buscar negocio</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={filters.vista === "mapa" ? "Buscar negocio para ir a él en el mapa" : "Buscar negocio por nombre o teléfono"}
            className="input-form min-h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <button type="button" onClick={openSheet} className={adminActionButtonSecondary}>
          <Filter className="h-4 w-4" aria-hidden />Filtros
          {chips.length ? <span className="rounded-full bg-accent/10 px-1.5 text-xs font-bold text-accent">{chips.length}</span> : null}
        </button>
      </div>

      {chips.length || search ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Filtrando:</span>
          {search ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-xs font-semibold text-foreground">
              Búsqueda: «{search}»
              <button type="button" onClick={() => onSearch("")} aria-label="Quitar la búsqueda" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-border-soft hover:bg-border">
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </span>
          ) : null}
          {chips.map((chip) => (
            <span key={chip.key} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-xs font-semibold text-foreground">
              {chip.label}
              <button type="button" onClick={() => onChange({ [chip.key]: undefined })} aria-label={`Quitar ${chip.label}`} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-border-soft hover:bg-border">
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </span>
          ))}
          <button type="button" onClick={onClear} className={`${adminActionButtonText} min-h-8 px-2 text-xs`}>Quitar todo</button>
        </div>
      ) : null}

      <FormSheet
        isOpen={open}
        onClose={() => setOpen(false)}
        icon={Filter}
        title="Filtros"
        description="Elige qué negocios ver. Se aplican a todas las pestañas, también al mapa."
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setDraft({})} className={adminActionButtonSecondary}>Quitar todos</button>
            <button type="button" onClick={() => { onChange({ ...draft, contact: showContact ? draft.contact : filters.contact }); setOpen(false); }} className={adminActionButtonPrimary}>Ver negocios</button>
          </div>
        }
      >
        <div className="grid gap-4">
          {isCoordinator ? (
            <label className={labelClass}>
              Quién lo trabaja
              <select value={draft.owner ?? ""} onChange={(event) => setDraft({ ...draft, owner: event.target.value || undefined })} className={selectClass}>
                <option value="">Todo el equipo</option>
                <option value="me">Yo</option>
                <option value="none">Nadie todavía</option>
                {people.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}
              </select>
            </label>
          ) : null}
          <label className={labelClass}>
            Municipio
            <select value={draft.municipio ?? ""} onChange={(event) => setDraft({ ...draft, municipio: event.target.value || undefined })} className={selectClass}>
              <option value="">Todos los municipios</option>
              {ZONES.map((zone) => <option key={zone.municipio} value={zone.municipio}>{zone.label}</option>)}
            </select>
          </label>
          <label className={labelClass}>
            Giro
            <select value={draft.giro ?? ""} onChange={(event) => setDraft({ ...draft, giro: event.target.value || undefined })} className={selectClass}>
              <option value="">Todos los giros</option>
              {GIRO_KEYS.map((key) => <option key={key} value={key}>{GIRO_COPY[key].label}</option>)}
            </select>
          </label>
          {showContact ? (
            <label className={labelClass}>
              Cómo contactarlo
              <select value={draft.contact ?? ""} onChange={(event) => setDraft({ ...draft, contact: (event.target.value || undefined) as LeadContactFilter | undefined })} className={selectClass}>
                <option value="">Cualquier contacto</option>
                {(Object.keys(CONTACT_LABEL) as LeadContactFilter[]).map((key) => <option key={key} value={key}>{CONTACT_LABEL[key]}</option>)}
              </select>
            </label>
          ) : null}
        </div>
      </FormSheet>
    </div>
  );
}
