"use client";

import { Notification } from "@/components/ui/Notification";

import { giroCopy } from "@/features/growth/constants/giroCopy";
import { EMAIL_STATUS_LABEL, NEXT_CHANNEL_LABEL, PHONE_STATUS_LABEL, VISIT_STATUS_LABEL } from "@/features/growth/constants/leadStages";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { LeadDataCardProps, LeadSheetAction } from "@/features/growth/interfaces/leadActions";

const fixClass = "shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-semibold text-accent hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";

function attempts(count: number): string {
  return count ? ` · ${count} ${count === 1 ? "intento" : "intentos"}` : "";
}

/** The prospect's data and channel states in one open list; wrong data is fixed right on its row. */
export function LeadDataCard({ lead, acquisition, ownerLabel, canEdit, canReassign, onAction }: LeadDataCardProps) {
  const rows: Array<{ label: string; value: string; fix?: { action: LeadSheetAction; label: string } }> = [
    { label: "Lo trabaja", value: ownerLabel, fix: canReassign ? { action: "owner", label: "Cambiar" } : undefined },
    {
      label: "WhatsApp",
      value: lead.phone_e164 ? `${formatMexicanPhoneInput(lead.phone_e164)} · ${PHONE_STATUS_LABEL[lead.phone_status]}${attempts(lead.whatsapp_attempts)}` : "Sin teléfono",
      fix: canEdit ? { action: "phone", label: lead.phone_e164 ? "Corregir" : "Agregar" } : undefined,
    },
    { label: "Giro", value: giroCopy(lead.giro).label, fix: canEdit ? { action: "giro", label: "Corregir" } : undefined },
    { label: "Dirección", value: [lead.address, lead.colonia, zoneByMunicipio(lead.municipio)?.label ?? lead.municipio].filter(Boolean).join(", ") || "Sin dirección" },
    { label: "Correo", value: lead.email ? `${lead.email} · ${EMAIL_STATUS_LABEL[lead.email_status]}` : "Sin correo" },
    { label: "Sigue por", value: NEXT_CHANNEL_LABEL[lead.next_channel] },
    { label: "Visita", value: `${VISIT_STATUS_LABEL[lead.visit_status]}${attempts(lead.visit_attempts)}` },
  ];

  return (
    <section className="grid gap-2" aria-label="Datos">
      <h3 className="text-base font-bold text-foreground">Datos</h3>
      {acquisition ? (
        <Notification tone="success" message={`Se registró · ${acquisition.bucket === "engine" ? "motor" : acquisition.bucket === "assisted" ? "asistido" : "solo"}${acquisition.channel ? ` por ${acquisition.channel}` : ""}.`} />
      ) : null}
      <dl className="divide-y divide-border-soft overflow-hidden rounded-xl border border-border bg-surface">
        {rows.map(({ label, value, fix }) => (
          <div key={label} className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm">
            <dt className="shrink-0 text-muted-foreground">{label}</dt>
            <dd className="flex min-w-0 items-start justify-end gap-1.5 text-right">
              <span className="min-w-0 font-semibold text-foreground wrap-break-word">{value}</span>
              {fix ? <button type="button" onClick={() => onAction(fix.action)} className={fixClass}>{fix.label}</button> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
