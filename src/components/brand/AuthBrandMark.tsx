"use client";

import { TlacoLogo, type TlacoLogoSize } from "@/components/brand/TlacoLogo";

/**
 * Logotipo con halo de acento para las pantallas de sesión (login, registro,
 * recuperar contraseña). Existía copiado seis veces entre esos tres archivos;
 * al vivir aquí, un cambio de marca se hace en un solo lugar.
 *
 * No lleva un icono aparte encima del nombre: el logotipo ya trae la moneda
 * como "o", y poner las dos cosas mostraría dos monedas.
 */

interface AuthBrandMarkProps {
  size?: TlacoLogoSize;
  /** Anima la caída de la moneda al montar. */
  animated?: boolean;
  className?: string;
}

export function AuthBrandMark({
  size = "xl",
  animated = false,
  className = "",
}: AuthBrandMarkProps) {
  return (
    <div
      className={`relative inline-flex ${className}`}
      /* En móvil este bloque va dentro del contenedor con `animate-auth-enter`
         (320ms). Retrasamos la caída hasta después de esa entrada para que los
         transforms no se compongan y el rebote se lea limpio. */
      style={animated ? { ["--tlaco-drop-delay" as string]: "420ms" } : undefined}
    >
      <div
        className="absolute inset-0 scale-150 rounded-3xl bg-accent opacity-20 blur-2xl"
        aria-hidden
      />
      <TlacoLogo size={size} animated={animated} className="relative" />
    </div>
  );
}
