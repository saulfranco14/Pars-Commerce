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
  className?: string;
}

export function AuthBrandMark({
  size = "lg",
  className = "",
}: AuthBrandMarkProps) {
  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className="absolute inset-0 scale-150 rounded-3xl bg-accent opacity-20 blur-2xl"
        aria-hidden
      />
      <TlacoLogo size={size} className="relative" />
    </div>
  );
}
