"use client";

import { useState } from "react";
import { EyeOff, UserX } from "lucide-react";

import { useColdLeads } from "@/features/growth/hooks/useColdLeads";
import { adminActionButtonDanger } from "@/components/admin/actionButtonClasses";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormSheet } from "@/components/ui/FormSheet";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { timeAgo } from "@/features/growth/helpers/nextActionReason";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { COLD_DAY_OPTIONS } from "@/features/growth/constants/dropReasons";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";

import type { ColdLeadsSheetProps } from "@/features/growth/interfaces/cleanup";

/** Clean the list: everyone who got a message days ago and never opened their store nor answered. */
export function ColdLeadsSheet({ isOpen, onClose, owner }: ColdLeadsSheetProps) {
  const cold = useColdLeads(isOpen, owner);
  const [confirming, setConfirming] = useState(false);
  const now = new Date();

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      icon={EyeOff}
      title="No abrieron su tienda"
      description="Les escribiste y nunca abrieron el enlace ni contestaron. Darlos de baja limpia tu lista para enfocarte en quien sí mostró interés."
      maxWidth="max-w-2xl"
      dismissible={!cold.busy}
      footer={
        <button type="button" disabled={!cold.selected.length || cold.busy} onClick={() => setConfirming(true)} className={`${adminActionButtonDanger} w-full`}>
          <UserX className="h-4 w-4" aria-hidden />Dar de baja ({cold.selected.length.toLocaleString("es-MX")})
        </button>
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Desde el último mensaje">
          {COLD_DAY_OPTIONS.map((option) => (
            <button
              key={option.days}
              type="button"
              aria-pressed={cold.days === option.days}
              onClick={() => cold.setDays(option.days)}
              className={`min-h-10 rounded-full border px-3 text-sm font-semibold ${cold.days === option.days ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {cold.result ? <Notification tone="success" message={cold.result} onDismiss={cold.clearResult} /> : null}
        {cold.failure ? <Notification tone="error" message={cold.failure} /> : null}

        {cold.isLoading && !cold.leads.length ? (
          <LoadingBlock message="Buscando a quienes no abrieron…" variant="skeleton" />
        ) : cold.error ? (
          <Notification tone="error" message="No pudimos traer la lista. Intenta de nuevo." />
        ) : cold.leads.length ? (
          <>
            <label className="flex min-h-11 items-center gap-3 rounded-xl bg-border-soft/40 px-3 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={cold.allChecked} onChange={cold.toggleAll} className="h-4.5 w-4.5 accent-accent" />
              {cold.leads.length.toLocaleString("es-MX")} {cold.leads.length === 1 ? "negocio" : "negocios"} · todos marcados
            </label>
            <ul className="grid max-h-[50vh] divide-y divide-border-soft overflow-y-auto rounded-xl border border-border">
              {cold.leads.map((lead) => (
                <li key={lead.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2 hover:bg-border-soft/30">
                    <input type="checkbox" checked={cold.selected.includes(lead.id)} onChange={() => cold.toggle(lead.id)} className="h-4.5 w-4.5 shrink-0 accent-accent" />
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-sm font-semibold text-foreground">{formatBusinessName(lead.business_name)}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {giroCopy(lead.giro).label} · {zoneByMunicipio(lead.municipio)?.label ?? lead.municipio} · {lead.whatsapp_attempts} {lead.whatsapp_attempts === 1 ? "mensaje" : "mensajes"}, el último {timeAgo(lead.last_whatsapp_at, now)}
                        {lead.owner_name ? ` · ${lead.owner_name}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="rounded-xl bg-border-soft/40 px-3 py-6 text-center text-sm text-muted-foreground">Nadie en esta lista: todos los que contactaste en ese plazo abrieron su tienda o te contestaron.</p>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={async () => {
          await cold.drop();
          setConfirming(false);
        }}
        title={`¿Dar de baja a ${cold.selected.length.toLocaleString("es-MX")}?`}
        description="No se les vuelve a escribir por WhatsApp ni por correo, y salen de las listas de todo el equipo."
        confirmLabel="Sí, dar de baja"
        variant="danger"
        loading={cold.busy}
      />
    </FormSheet>
  );
}
