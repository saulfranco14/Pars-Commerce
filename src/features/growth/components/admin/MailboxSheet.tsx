"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Mail } from "lucide-react";

import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";

import { mailboxSchema } from "@/features/growth/validations/engineSchemas";

import type { MailboxFormValues } from "@/features/growth/validations/engineSchemas";

interface MailboxSheetProps {
  isOpen: boolean;
  nextIndex: number;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: MailboxFormValues) => Promise<boolean>;
}

export function MailboxSheet({ isOpen, nextIndex, busy, onClose, onSubmit }: MailboxSheetProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MailboxFormValues>({
    resolver: yupResolver(mailboxSchema),
    values: { address: "", display_name: "Saúl · Tlaco", secret_env_key: `GROWTH_MAILBOX_${nextIndex}_PASSWORD`, daily_cap: 30 },
  });

  const submit = handleSubmit(async (values) => {
    if (await onSubmit(values)) {
      reset();
      onClose();
    }
  });

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar buzón de Gmail"
      description="Aquí va solo el nombre de la variable. La contraseña de aplicación vive en .env.local o en Vercel, nunca en la base."
      icon={Mail}
      footer={<button type="submit" form="mailbox-form" disabled={busy} className={`${adminActionButtonPrimary} w-full`}>{busy ? "Guardando…" : "Agregar buzón"}</button>}
    >
      <form id="mailbox-form" onSubmit={submit} className="grid gap-4" noValidate>
        <FormInput label="Correo de Gmail" type="email" autoComplete="off" placeholder="tlaco.ventas@gmail.com" error={errors.address?.message} {...register("address")} />
        <FormInput label="Nombre que verá el negocio" error={errors.display_name?.message} {...register("display_name")} />
        <FormInput
          label="Variable con la contraseña"
          hint="Solo el nombre. Su valor (las 16 letras) va en .env.local o en Vercel → Settings → Environment Variables."
          error={errors.secret_env_key?.message}
          {...register("secret_env_key")}
        />
        <FormInput label="Tope diario" type="number" inputMode="numeric" hint="Arranca en 10 y sube 5 por semana hasta este tope." error={errors.daily_cap?.message} {...register("daily_cap")} />
      </form>
    </FormSheet>
  );
}
