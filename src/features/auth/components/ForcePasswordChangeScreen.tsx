"use client";

import { ShieldCheck } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";

/**
 * First login with a one-time password the business handed over: the person
 * picks their own before seeing anything else, so the owner never knows it.
 */
export function ForcePasswordChangeScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <TlacoLogo size="md" />
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <ShieldCheck className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">Crea tu contraseña</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Entraste con una contraseña temporal que te dio el negocio. Elige una propia; nadie más la va
          a conocer.
        </p>
        <div className="mt-6">
          <ChangePasswordForm submitLabel="Guardar y entrar" />
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 min-h-11 w-full cursor-pointer rounded-xl text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
