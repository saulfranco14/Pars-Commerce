"use client";

import { useId } from "react";

/**
 * Logotipo de Tlaco: la moneda ES la O de la palabra.
 *
 * No es "tipografía + insignia al lado" — la moneda es una letra, y el mismo
 * SVG se reutiliza suelto como icono de app. Eso es lo que evita que el
 * logotipo se lea como una fuente pesada con un adorno.
 *
 * El tlaco fue la moneda de menor denominación de la Nueva España, la que se
 * usaba para el comercio diario; de ahí la moneda, y de ahí la mitad más
 * oscura (náhuatl `tlacotl` = "mitad").
 *
 * Escalado: arriba de `sm` la moneda lleva la mitad en dos tonos; en `sm` va
 * lisa porque a ese tamaño el segundo tono se convierte en ruido.
 *
 * Las animaciones se aplican con clases (no inline) para que el giro al pasar
 * el mouse pueda ganarle por especificidad a la caída inicial.
 */

export type TlacoLogoSize = "sm" | "md" | "lg" | "xl";

interface TlacoLogoProps {
  size?: TlacoLogoSize;
  /** Anima la caída de la moneda al montar. Reservado al header del landing. */
  animated?: boolean;
  className?: string;
}

const SIZES: Record<
  TlacoLogoSize,
  { text: string; coin: string; drop: string }
> = {
  sm: { text: "text-lg", coin: "h-[0.62em] w-[0.62em]", drop: "-mb-[0.04em]" },
  md: { text: "text-2xl", coin: "h-[0.60em] w-[0.60em]", drop: "-mb-[0.03em]" },
  lg: { text: "text-4xl", coin: "h-[0.58em] w-[0.58em]", drop: "-mb-[0.03em]" },
  // `xl` es el logotipo actuando como marca principal de una pantalla (login,
  // registro), no como firma de un header. Ahí compite con el formulario por
  // atención, así que necesita el salto de tamaño.
  xl: { text: "text-5xl", coin: "h-[0.57em] w-[0.57em]", drop: "-mb-[0.025em]" },
};

export function TlacoLogo({
  size = "md",
  animated = false,
  className = "",
}: TlacoLogoProps) {
  const s = SIZES[size];
  // useId evita que las máscaras choquen cuando hay más de un logo en la
  // página (nav y footer conviven en el landing).
  const maskId = `tlaco-counter-${useId()}`;

  return (
    <span
      className={`tlaco-logo inline-flex items-baseline font-bold tracking-tight text-foreground ${s.text} ${className}`}
    >
      {/* El wordmark completo vive en el sr-only: visualmente la "o" es un SVG,
          así que las letras visibles se ocultan al lector para que no anuncie
          "Tlac Tlaco". */}
      <span className="sr-only">Tlaco</span>

      <span
        aria-hidden
        className={`tlaco-stem${animated ? " tlaco-stem--enter" : ""}`}
      >
        Tlac
      </span>

      <span
        aria-hidden
        className={`tlaco-coin ml-[0.03em] inline-block ${s.coin} ${s.drop}${
          animated ? " tlaco-coin--drop" : ""
        }`}
      >
        {/* El contrapunzón se perfora con una máscara en vez de pintarse del
            color del fondo: así la moneda se lee como "o" sobre cualquier
            superficie sin tener que configurarle el color a mano. */}
        <svg viewBox="0 0 32 32" className="block h-full w-full">
          <mask id={maskId}>
            <rect width="32" height="32" fill="#fff" />
            <circle cx="16" cy="16" r="6" fill="#000" />
          </mask>
          <g mask={`url(#${maskId})`}>
            <circle cx="16" cy="16" r="15" fill="var(--coin-face)" />
            {size !== "sm" && (
              <path d="M16 1a15 15 0 0 1 0 30z" fill="var(--coin-edge)" />
            )}
          </g>
        </svg>
      </span>
    </span>
  );
}
