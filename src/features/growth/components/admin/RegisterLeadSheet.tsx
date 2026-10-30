"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Copy, ExternalLink, Mail, Phone, Store, UserRound, UserPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useLeadRegistration } from "@/features/growth/hooks/useLeadRegistration";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { leadRegistrationSchema } from "@/features/growth/validations/teamSchemas";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { RegisterLeadSheetProps } from "@/features/growth/interfaces/lead";
import type { LeadRegistrationFormValues } from "@/features/growth/validations/teamSchemas";

type Mode = "correo" | "aqui";

const MODES = [
  { value: "correo", label: "Le mando su acceso" },
  { value: "aqui", label: "Lo registro aquí" },
];

/** «Dar de alta su negocio»: an invitation by email, or the registration opened on the owner's own phone. */
export function RegisterLeadSheet({ isOpen, lead, onClose, onRegistered }: RegisterLeadSheetProps) {
  const registration = useLeadRegistration(lead.id);
  const [mode, setMode] = useState<Mode>("correo");
  const [copied, setCopied] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadRegistrationFormValues>({
    resolver: yupResolver(leadRegistrationSchema),
    defaultValues: { business_name: "", owner_name: "", owner_email: "", owner_phone: "" },
  });
  const { reset: resetRegistration, loadClaimLink } = registration;

  useEffect(() => {
    if (!isOpen) return;
    resetRegistration();
    setCopied(false);
    reset({
      business_name: formatBusinessName(lead.business_name),
      owner_name: "",
      owner_email: lead.email ?? "",
      owner_phone: lead.phone_e164 ? formatMexicanPhoneInput(lead.phone_e164) : "",
    });
  }, [isOpen, lead, reset, resetRegistration]);

  useEffect(() => {
    if (isOpen && mode === "aqui") void loadClaimLink();
  }, [isOpen, mode, loadClaimLink]);

  const submit = handleSubmit(async (values) => {
    if (await registration.register(values)) onRegistered();
  });

  async function copy() {
    if (!registration.claimUrl) return;
    try {
      await navigator.clipboard.writeText(registration.claimUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const done = registration.result;
  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Dar de alta su negocio"
      description={`${formatBusinessName(lead.business_name)} queda registrado a tu nombre.`}
      icon={UserPlus}
      footer={
        mode === "correo" && !done ? (
          <button type="submit" form="register-lead-form" disabled={registration.busy} className={`${adminActionButtonPrimary} w-full`}>
            {registration.busy ? "Creando su tienda…" : "Crear su tienda y mandarle el acceso"}
          </button>
        ) : (
          <button type="button" onClick={onClose} className={`${adminActionButtonSecondary} w-full`}>Listo</button>
        )
      }
    >
      <div className="grid gap-4">
        {!done ? <FilterTabs tabs={MODES} activeValue={mode} onTabChange={(value) => setMode(value as Mode)} ariaLabel="Cómo registrarlo" /> : null}
        {registration.error ? <Notification tone="error" message={registration.error} /> : null}

        {done ? (
          <Notification
            tone={done.emailDelivery === "failed" ? "warning" : "success"}
            title="Su tienda ya existe"
            message={done.emailDelivery === "failed"
              ? "El correo no salió. Pásale por WhatsApp el enlace de abajo para que cree su contraseña."
              : "Le llegó un correo para crear su contraseña. Ya aparece en «Activación» para que lo acompañes hasta su primera venta."}
          />
        ) : null}
        {done?.invitationUrl && done.emailDelivery === "failed" ? <p className="break-all rounded-xl bg-border-soft/50 p-3 text-sm text-foreground">{done.invitationUrl}</p> : null}

        {mode === "correo" && !done ? (
          <form id="register-lead-form" onSubmit={submit} className="grid gap-4" noValidate>
            <FormInput label="Nombre del negocio" icon={Store} error={errors.business_name?.message} {...register("business_name")} />
            <FormInput label="Nombre del dueño" icon={UserRound} autoComplete="off" error={errors.owner_name?.message} {...register("owner_name")} />
            <FormInput label="Correo del dueño" icon={Mail} type="email" autoComplete="off" hint="Ahí le llega el enlace para crear su contraseña." error={errors.owner_email?.message} {...register("owner_email")} />
            <FormInput label="Su teléfono" icon={Phone} type="tel" inputMode="tel" optional error={errors.owner_phone?.message} {...register("owner_phone")} />
          </form>
        ) : null}

        {mode === "aqui" && !done ? (
          <div className="grid justify-items-center gap-3 text-center">
            <p className="text-sm text-muted-foreground">Que el dueño escanee el código con su celular, o ábrelo tú y entrégaselo. Los datos de su negocio ya van llenos.</p>
            {registration.claimUrl ? (
              <>
                <div className="rounded-2xl bg-white p-3"><QRCodeSVG value={registration.claimUrl} size={196} level="M" /></div>
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={copy} className={adminActionButtonSecondary}><Copy className="h-4 w-4" aria-hidden />{copied ? "Copiado" : "Copiar enlace"}</button>
                  <a href={registration.claimUrl} target="_blank" rel="noopener noreferrer" className={adminActionButtonSecondary}><ExternalLink className="h-4 w-4" aria-hidden />Abrir aquí</a>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Preparando el enlace…</p>
            )}
          </div>
        ) : null}
      </div>
    </FormSheet>
  );
}
