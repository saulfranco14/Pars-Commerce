"use client";

import { Loader2, Monitor, ShieldX, WifiOff } from "lucide-react";

import { KioskScreenShell } from "@/features/dispositivos/components/kiosk/KioskScreenShell";
import { useDeviceEnrollment } from "@/features/dispositivos/hooks/useDeviceEnrollment";

/**
 * Lo que se ve en la pantalla grande mientras espera aprobación. El código va
 * enorme porque el dueño lo lee desde donde esté parado y lo compara con el
 * panel.
 */
export function DeviceEnrollmentScreen({
  tenantSlug,
  enrollKey,
  children,
}: {
  tenantSlug: string;
  enrollKey: string;
  children: React.ReactNode;
}) {
  const state = useDeviceEnrollment(tenantSlug, enrollKey);

  if (state.phase === "ready") return <>{children}</>;

  if (state.phase === "starting") {
    return (
      <KioskScreenShell
        icon={Loader2}
        spin
        title="Registrando esta pantalla"
        description="Un momento. Se está anunciando con el negocio."
      />
    );
  }

  if (state.phase === "waiting") {
    return (
      <KioskScreenShell
        icon={Monitor}
        title="Falta que autoricen esta pantalla"
        description="En el panel del negocio, entra a Configuración → Pantallas y aprueba la que muestre este código:"
        footer={
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Se activa sola en cuanto la apruebes
          </span>
        }
      >
        <p
          className="mt-10 font-mono text-8xl font-bold tracking-[0.25em] text-white xl:text-9xl"
          aria-label={`Código ${state.enrollCode.split("").join(" ")}`}
        >
          {state.enrollCode}
        </p>
      </KioskScreenShell>
    );
  }

  if (state.phase === "rejected") {
    return (
      <KioskScreenShell
        icon={ShieldX}
        tone="alert"
        title="Esta pantalla no está autorizada"
        description="El negocio rechazó o revocó el acceso. Recarga para volver a pedir permiso."
      />
    );
  }

  return (
    <KioskScreenShell
      icon={WifiOff}
      tone="alert"
      title="No se pudo registrar"
      description={state.message}
    />
  );
}
