"use client";

import { useMemo } from "react";
import { Hand } from "lucide-react";

import { BrandImage } from "@/features/qr/components/BrandImage";

import type { KioskAttractScreenProps } from "@/features/dispositivos/interfaces/kioskUi";

/** Dos vueltas del mismo carrete: la tira se recorre 50% y el corte no se ve. */
const MARQUEE_LOOPS = 2;

/**
 * Lo que la pantalla muestra cuando nadie la está usando. Es la superficie que
 * invita a acercarse, así que va a sangre: fotos del catálogo desfilando detrás
 * y un solo objetivo de toque, la pantalla completa.
 */
export function KioskAttractScreen({
  tenantName,
  tenantLogoUrl,
  products,
  onStart,
}: KioskAttractScreenProps) {
  const withPhoto = useMemo(
    () => products.filter((p) => p.image_url).slice(0, 8),
    [products],
  );

  const strip = useMemo(
    () =>
      withPhoto.length === 0
        ? []
        : Array.from({ length: MARQUEE_LOOPS }, () => withPhoto).flat(),
    [withPhoto],
  );

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-linear-to-br from-accent via-accent to-accent/80 px-8 text-center">
      {strip.length > 0 && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center opacity-25"
          aria-hidden
        >
          <div className="kiosk-marquee flex w-max gap-6">
            {strip.map((product, i) => (
              <BrandImage
                key={`${product.id}-${i}`}
                src={product.image_url}
                alt=""
                className="h-64 w-64 shrink-0 xl:h-80 xl:w-80"
                rounded="rounded-3xl"
                sizes="320px"
                priority={i < 4}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-black/25" />

      <div className="relative flex flex-col items-center">
        {tenantLogoUrl && (
          <BrandImage
            src={tenantLogoUrl}
            alt={tenantName}
            className="mb-8 h-28 w-28 xl:h-36 xl:w-36"
            rounded="rounded-3xl"
            sizes="144px"
            priority
          />
        )}

        <h1 className="max-w-4xl text-6xl font-bold leading-none tracking-tight text-white drop-shadow-lg xl:text-8xl">
          {tenantName}
        </h1>

        <p className="mt-6 text-2xl font-medium text-white/85 xl:text-3xl">
          Arma tu pedido aquí, sin filas
        </p>

        <span className="kiosk-attract-cta mt-16 inline-flex min-h-20 items-center gap-4 rounded-full bg-white px-14 text-3xl font-bold text-accent shadow-2xl xl:text-4xl">
          <Hand className="h-9 w-9 shrink-0" aria-hidden />
          Toca para empezar
        </span>
      </div>

      {/* Toda la pantalla es el objetivo de toque. Va como capa encima y no
          envolviendo al contenido: un <button> no puede contener un <h1>. */}
      <button
        type="button"
        onClick={onStart}
        aria-label={`Empezar un pedido en ${tenantName}`}
        className="absolute inset-0 z-10 cursor-pointer"
      />
    </div>
  );
}
