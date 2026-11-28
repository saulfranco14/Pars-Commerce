"use client";

import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Link from "next/link";
import { Coins } from "lucide-react";

import { useParaSignup } from "@/features/growth/hooks/useParaSignup";
import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { FormPasswordInput } from "@/components/ui/FormPasswordInput";
import { Notification } from "@/components/ui/Notification";

import { STUDIO_GIFT_TLACOS } from "@/features/studio/constants/studio";
import { formatMexicanPhoneInput } from "@/lib/phone";
import { paraSignupSchema } from "@/features/growth/validations/paraSignupSchema";

import type { ParaAdsPageData, ParaSignupValues } from "@/features/growth/interfaces/paraAds";

/** «Guardar»: account and business in one screen, with what we already know filled in. */
export function ParaSignupSheet({ token, data, isOpen, onClose }: { token: string; data: ParaAdsPageData; isOpen: boolean; onClose: () => void }) {
  const signup = useParaSignup(token, data.prefill);
  const { register, control, handleSubmit, formState: { errors } } = useForm<ParaSignupValues>({
    resolver: yupResolver(paraSignupSchema),
    defaultValues: { businessName: data.prefill.businessName, phone: formatMexicanPhoneInput(data.prefill.phone), email: "", password: "" },
  });

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Guarde sus anuncios"
      description={`Le regalamos ${STUDIO_GIFT_TLACOS} Tlacos para hacer más, y ve el reporte de su zona.`}
      icon={Coins}
      footer={
        <button type="submit" form="para-signup" disabled={signup.saving} className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground disabled:opacity-60">
          {signup.saving ? "Guardando…" : "Guardar"}
        </button>
      }
    >
      <form id="para-signup" noValidate onSubmit={handleSubmit(signup.submit)} className="grid gap-4">
        {signup.error ? <Notification tone="error" message={signup.error} onDismiss={signup.clearError} /> : null}
        <FormInput label="Negocio" autoComplete="organization" error={errors.businessName?.message} {...register("businessName")} />
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <FormInput label="WhatsApp" type="tel" inputMode="tel" autoComplete="tel" placeholder="55 1234 5678" error={errors.phone?.message} value={field.value} onBlur={field.onBlur} onChange={(event) => field.onChange(formatMexicanPhoneInput(event.target.value))} />
          )}
        />
        <FormInput label="Correo" type="email" inputMode="email" autoComplete="email" placeholder="sucorreo@gmail.com" error={errors.email?.message} {...register("email")} />
        <FormPasswordInput id="para-password" label="Contraseña" autoComplete="new-password" placeholder="Mínimo 8 caracteres" error={errors.password?.message} {...register("password")} />
        <p className="text-xs leading-5 text-muted-foreground">
          Al guardar acepta los <Link href="/terminos" className="underline">Términos</Link> y el <Link href="/privacidad" className="underline">Aviso de Privacidad</Link>. No se cobra nada.
        </p>
      </form>
    </FormSheet>
  );
}
