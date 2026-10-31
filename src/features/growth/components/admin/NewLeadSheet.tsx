"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Mail, MapPin, Phone, Store } from "lucide-react";

import { useNewLead } from "@/features/growth/hooks/useNewLead";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";

import { GIRO_COPY, GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { LEAD_STAGE_META } from "@/features/growth/constants/leadStages";
import { leadPath } from "@/features/growth/constants/routes";
import { ZONES } from "@/features/growth/constants/zoneCopy";
import { newLeadSchema } from "@/features/growth/validations/teamSchemas";

import type { ContactConflict, LeadSourceDetail, NewLeadSheetProps } from "@/features/growth/interfaces/lead";
import type { NewLeadFormValues } from "@/features/growth/validations/teamSchemas";

const SOURCES: Array<{ value: LeadSourceDetail; label: string }> = [
  { value: "visita", label: "Lo visité" },
  { value: "referido", label: "Me lo recomendaron" },
  { value: "redes", label: "Redes" },
  { value: "otro", label: "Otro" },
];

const selectClass = "input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised px-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function conflictText(conflict: ContactConflict): string {
  const since = conflict.since
    ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" }).format(new Date(conflict.since))
    : null;
  const who = conflict.ownerName ? `Ya lo trabaja ${conflict.ownerName}` : "Ya está en la lista, sin nadie asignado";
  return `${who}${since ? ` desde el ${since}` : ""} (etapa «${LEAD_STAGE_META[conflict.stage].label}»). No se puede agregar dos veces; si debe ser tuyo, pídele al coordinador que lo reasigne.`;
}

/** A business met on the street or by referral; it becomes the person's own prospect. */
export function NewLeadSheet({ isOpen, onClose }: NewLeadSheetProps) {
  const router = useRouter();
  const newLead = useNewLead();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<NewLeadFormValues>({
    resolver: yupResolver(newLeadSchema),
    defaultValues: { business_name: "", phone: "", email: "", giro: GIRO_KEYS[0], municipio: ZONES[0].municipio, colonia: "", source_detail: "visita", note: "" },
  });
  const source = watch("source_detail");
  const { reset: resetResult } = newLead;

  useEffect(() => {
    if (!isOpen) return;
    reset();
    resetResult();
  }, [isOpen, reset, resetResult]);

  const submit = handleSubmit(async (values) => {
    const id = await newLead.submit(values);
    if (!id) return;
    onClose();
    router.push(leadPath(id));
  });

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo prospecto"
      description="Un negocio que viste o te recomendaron. Queda a tu nombre."
      icon={Store}
      footer={<button type="submit" form="new-lead-form" disabled={newLead.busy} className={`${adminActionButtonPrimary} w-full`}>{newLead.busy ? "Guardando…" : "Guardar prospecto"}</button>}
    >
      <form id="new-lead-form" onSubmit={submit} className="grid gap-4" noValidate>
        {newLead.conflict ? <Notification tone="error" title="Este contacto ya existe" message={conflictText(newLead.conflict)} /> : null}
        {newLead.error ? <Notification tone="error" message={newLead.error} /> : null}
        <FormInput label="Nombre del negocio" icon={Store} autoComplete="off" error={errors.business_name?.message} {...register("business_name")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Teléfono" icon={Phone} type="tel" inputMode="tel" optional placeholder="55 1234 5678" error={errors.phone?.message} {...register("phone")} />
          <FormInput label="Correo" icon={Mail} type="email" optional autoComplete="off" error={errors.email?.message} {...register("email")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold text-foreground">
            Giro
            <select className={selectClass} {...register("giro")}>
              {GIRO_KEYS.map((key) => <option key={key} value={key}>{GIRO_COPY[key].label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-foreground">
            Municipio
            <select className={selectClass} {...register("municipio")}>
              {ZONES.map((zone) => <option key={zone.municipio} value={zone.municipio}>{zone.label}</option>)}
            </select>
          </label>
        </div>
        <FormInput label="Colonia" icon={MapPin} optional autoComplete="off" error={errors.colonia?.message} {...register("colonia")} />
        <fieldset className="grid gap-2">
          <legend className="pb-1 text-sm font-semibold text-foreground">¿Cómo lo conociste?</legend>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={source === item.value}
                onClick={() => setValue("source_detail", item.value)}
                className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${source === item.value ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-foreground hover:border-accent/50"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-1.5 text-sm font-semibold text-foreground">
          Nota <span className="text-xs font-normal text-muted-foreground">Opcional. Qué platicaron, cuándo le conviene que le escribas.</span>
          <textarea rows={3} maxLength={280} className={`${selectClass} py-2`} {...register("note")} />
        </label>
      </form>
    </FormSheet>
  );
}
