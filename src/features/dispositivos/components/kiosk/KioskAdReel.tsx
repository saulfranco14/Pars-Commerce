"use client";

import { useEffect, useState } from "react";
import { Hand } from "lucide-react";

import { KIOSK_AD_SECONDS } from "@/features/dispositivos/constants/kiosk";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { KioskAdReelProps } from "@/features/dispositivos/interfaces/kioskUi";

/**
 * La pantalla de espera con anuncios de Studio: uno a la vez, a pantalla
 * completa. Vertical muestra el 9:16; horizontal pone el 4:5 junto al nombre y
 * el precio del catálogo en vivo. Tocar abre el producto que se está viendo.
 */
export function KioskAdReel({
  tenantName,
  tenantLogoUrl,
  ads,
  products,
  onStart,
}: KioskAdReelProps) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (ads.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % ads.length),
      KIOSK_AD_SECONDS * 1000,
    );
    return () => clearInterval(timer);
  }, [ads.length]);

  const current = ads[index % ads.length],
    product = products.find((p) => p.id === current.productId);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-neutral-950 text-white">
      {ads.map((ad, i) => (
        <div
          key={ad.productId}
          aria-hidden={i !== index}
          className={`absolute inset-0 flex pb-[18dvh] transition-opacity landscape:pb-0 duration-700 motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.storyUrl ?? ad.cardUrl ?? ""}
            alt=""
            className="h-full w-full object-contain landscape:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.cardUrl ?? ad.storyUrl ?? ""}
            alt=""
            className="hidden h-full w-auto max-w-11/20 object-contain landscape:block"
          />
        </div>
      ))}

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-9/20 flex-col justify-center gap-6 px-[4%] landscape:flex">
        <p className="flex items-center gap-3 text-xl font-semibold text-white/70">
          {tenantLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tenantLogoUrl}
              alt=""
              className="h-10 w-10 rounded-xl bg-white object-contain"
            />
          )}
          {tenantName}
        </p>
        {product && (
          <>
            <p className="text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
              {product.name}
            </p>
            <p className="text-6xl font-bold tracking-tight tabular-nums xl:text-7xl">
              {formatCurrency(Number(product.price))}
            </p>
          </>
        )}
        <span className="kiosk-attract-cta inline-flex min-h-16 items-center gap-3 self-start rounded-full bg-white px-10 text-2xl font-bold text-neutral-950 shadow-2xl">
          <Hand className="h-7 w-7 shrink-0" aria-hidden />
          Toca para pedir
        </span>
        {ads.length > 1 && (
          <span className="flex gap-2" aria-hidden>
            {ads.map((ad, i) => (
              <span
                key={ad.productId}
                className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2 bg-white/35"}`}
              />
            ))}
          </span>
        )}
      </div>

      <span className="kiosk-attract-cta pointer-events-none absolute bottom-[5dvh] left-1/2 inline-flex min-h-16 -translate-x-1/2 items-center gap-3 rounded-full bg-white px-10 text-2xl font-bold whitespace-nowrap text-neutral-950 shadow-2xl landscape:hidden">
        <Hand className="h-7 w-7 shrink-0" aria-hidden />
        Toca para pedir
      </span>

      <button
        type="button"
        onClick={() => onStart(product ? current.productId : undefined)}
        aria-label={
          product
            ? `Pedir ${product.name} en ${tenantName}`
            : `Empezar un pedido en ${tenantName}`
        }
        className="absolute inset-0 z-10 cursor-pointer"
      />
    </div>
  );
}
