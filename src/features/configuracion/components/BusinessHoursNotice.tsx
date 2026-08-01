"use client";

import Link from "next/link";

import { Notification } from "@/components/ui/Notification";

import type { BusinessHoursNoticeProps } from "@/features/configuracion/interfaces/businessHoursNotice";

// Only shown once hours actually matter: without scheduling enabled they
// change nothing.
export function BusinessHoursNotice({
  hours,
  schedulingEnabled,
  tenantSlug,
}: BusinessHoursNoticeProps) {
  if (hours !== null || !schedulingEnabled) return null;

  return (
    <Notification
      tone="warning"
      title="Falta dar de alta tus horarios"
      message={
        <>
          Estás dejando que tus clientes agenden su recolección, pero sin
          horarios pueden elegir cualquier hora — incluso de madrugada.{" "}
          <Link
            href={`/dashboard/${tenantSlug}/configuracion?tab=horarios`}
            className="font-semibold underline underline-offset-2"
          >
            Configúralos ahora
          </Link>
          . Si abres todo el día, marca 24/7 y listo.
        </>
      }
    />
  );
}
