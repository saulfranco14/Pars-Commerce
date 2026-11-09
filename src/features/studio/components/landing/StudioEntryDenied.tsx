import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

export function StudioEntryDenied() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-5 px-5 py-12">
      <TlacoLogo size="lg" />
      <h1 className="text-3xl font-bold">
        Necesitas acceso a Studio en este negocio.
      </h1>
      <p className="text-sm leading-7 text-muted-foreground">
        Revisa tu invitación y pide al propietario acceso desde Equipo. No se
        contratará Studio ni se cambiará a otro negocio automáticamente.
      </p>
      <Link href="/dashboard" className={adminActionButtonSecondary}>
        <ArrowLeft className="h-4 w-4" />
        Volver a mi cuenta
      </Link>
    </main>
  );
}
