"use client";

import type { LucideIcon } from "lucide-react";

interface KioskScreenShellProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Contenido grande bajo el texto: el código de registro, por ejemplo. */
  children?: React.ReactNode;
  /** Nota al pie, en chico. */
  footer?: React.ReactNode;
  /** `brand` para los estados normales; `alert` cuando algo salió mal. */
  tone?: "brand" | "alert";
  /** Gira el ícono. Sin esto un estado de espera se ve congelado. */
  spin?: boolean;
}

/**
 * Fondo de pantalla completa para los estados de la pantalla de autoservicio:
 * registrando, esperando aprobación, cargando el menú, rechazada.
 *
 * Existe porque estos estados usaban el spinner del dashboard, que en una
 * pantalla de 1080p es un texto diminuto en medio de un vacío blanco: parece que
 * el dispositivo se quedó colgado.
 */
export function KioskScreenShell({
  icon: Icon,
  title,
  description,
  children,
  footer,
  tone = "brand",
  spin = false,
}: KioskScreenShellProps) {
  const background =
    tone === "alert"
      ? "bg-linear-to-br from-slate-800 via-slate-900 to-black"
      : "bg-linear-to-br from-accent via-accent to-accent/80";

  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center px-8 text-center ${background}`}
    >
      <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
        <Icon
          className={`h-12 w-12 text-white ${spin ? "animate-spin" : ""}`}
          aria-hidden
        />
      </span>

      <h1 className="mt-8 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
        {title}
      </h1>

      {description && (
        <p className="mt-4 max-w-2xl text-xl text-white/80 xl:text-2xl">
          {description}
        </p>
      )}

      {children}

      {footer && (
        <div className="mt-12 text-base text-white/70 xl:text-lg">{footer}</div>
      )}
    </div>
  );
}
