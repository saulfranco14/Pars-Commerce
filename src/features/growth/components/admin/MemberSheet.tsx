"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Mail, MessageCircle, PenLine, Target, UserPlus, UserRound } from "lucide-react";

import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { ZonePicker } from "@/features/growth/components/admin/ZonePicker";
import { adminActionButtonDanger, adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { GROWTH_ROLE_HINT, GROWTH_ROLE_LABEL } from "@/features/growth/constants/growthRoles";
import { memberSchema } from "@/features/growth/validations/teamSchemas";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { GrowthRole, GrowthZone, MemberSheetProps } from "@/features/growth/interfaces/member";
import type { MemberFormValues } from "@/features/growth/validations/teamSchemas";

const ROLES: GrowthRole[] = ["prospector", "coordinador"];

export function MemberSheet({ isOpen, member, municipios, busy, onClose, onInvite, onSave }: MemberSheetProps) {
  const editing = Boolean(member);
  const [zones, setZones] = useState<GrowthZone[]>(member?.zones ?? []);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<MemberFormValues>({
    resolver: yupResolver(memberSchema),
    defaultValues: { display_name: "", email: "", whatsapp: "", signature: "", role: "prospector", daily_goal: 20 },
  });

  useEffect(() => {
    if (!isOpen) return;
    setZones(member?.zones ?? []);
    reset({
      display_name: member?.display_name ?? "",
      email: member?.email ?? "",
      whatsapp: member?.whatsapp_e164 ? formatMexicanPhoneInput(member.whatsapp_e164) : "",
      signature: member?.signature ?? "",
      role: member?.role ?? "prospector",
      daily_goal: member?.daily_goal ?? 20,
    });
  }, [isOpen, member, reset]);

  const role = watch("role");
  const name = watch("display_name");

  const submit = handleSubmit(async (values) => {
    const signature = values.signature || `${values.display_name.trim()} · Tlaco`;
    const saved = member
      ? await onSave(member.user_id, { display_name: values.display_name, whatsapp: values.whatsapp, signature, role: values.role, zones, daily_goal: values.daily_goal })
      : await onInvite({ email: values.email, display_name: values.display_name, whatsapp: values.whatsapp, signature, role: values.role, zones });
    if (saved) onClose();
  });

  async function toggleSuspended() {
    if (!member) return;
    if (await onSave(member.user_id, { status: member.status === "suspended" ? "active" : "suspended" })) onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? `Editar a ${member?.display_name}` : "Invitar al equipo"}
      description={editing ? "Los cambios aplican desde su siguiente acción." : "Le llega un correo para crear su contraseña. Entra directo a Prospección."}
      icon={editing ? UserRound : UserPlus}
      footer={
        <div className="grid gap-2">
          <button type="submit" form="member-form" disabled={busy} className={`${adminActionButtonPrimary} w-full`}>
            {busy ? "Guardando…" : editing ? "Guardar cambios" : "Mandar invitación"}
          </button>
          {member ? (
            <button type="button" disabled={busy} onClick={toggleSuspended} className={`${member.status === "suspended" ? adminActionButtonSecondary : adminActionButtonDanger} w-full`}>
              {member.status === "suspended" ? "Reactivar acceso" : "Suspender acceso"}
            </button>
          ) : null}
        </div>
      }
    >
      <form id="member-form" onSubmit={submit} className="grid gap-4" noValidate>
        <FormInput label="Nombre" icon={UserRound} autoComplete="off" error={errors.display_name?.message} {...register("display_name")} />
        <FormInput label="Correo para entrar" icon={Mail} type="email" autoComplete="off" disabled={editing} error={errors.email?.message} {...register("email")} />
        <FormInput
          label="Su WhatsApp de Tlaco"
          icon={MessageCircle}
          type="tel"
          inputMode="tel"
          optional
          placeholder="55 1234 5678"
          hint="Los prospectos que trabaje le escribirán a este número desde su página «Para ti»."
          error={errors.whatsapp?.message}
          {...register("whatsapp")}
        />
        <FormInput
          label="Firma en los mensajes"
          icon={PenLine}
          optional
          placeholder={name ? `${name.trim()} · Tlaco` : "Nombre Apellido · Tlaco"}
          hint="Su nombre de pila también va en «Mi nombre es…» de cada mensaje."
          error={errors.signature?.message}
          {...register("signature")}
        />
        <FormInput label="Meta diaria de primeros mensajes" icon={Target} type="number" inputMode="numeric" error={errors.daily_goal?.message} {...register("daily_goal")} />

        <fieldset className="grid gap-2">
          <legend className="pb-1 text-sm font-semibold text-foreground">Rol</legend>
          {ROLES.map((value) => (
            <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${role === value ? "border-accent bg-accent/5" : "border-border"}`}>
              <input type="radio" value={value} checked={role === value} onChange={() => setValue("role", value)} className="mt-1 h-4 w-4 accent-accent" />
              <span className="grid gap-0.5">
                <span className="text-sm font-bold text-foreground">{GROWTH_ROLE_LABEL[value]}</span>
                <span className="text-xs text-muted-foreground">{GROWTH_ROLE_HINT[value]}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="pb-1 text-sm font-semibold text-foreground">Zonas que trabaja</legend>
          <ZonePicker key={member?.user_id ?? "new"} value={zones} municipios={municipios} onChange={setZones} />
        </fieldset>
      </form>
    </FormSheet>
  );
}
