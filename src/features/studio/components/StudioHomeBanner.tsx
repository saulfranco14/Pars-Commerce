"use client";
import Link from "next/link";
import { ArrowRight, Coins, Package, WandSparkles, X } from "lucide-react";
import { useStudioHomeInvite } from "../hooks/useStudioHomeInvite";
import { StudioActionLink } from "./StudioActionLink";

/** Business home, above everything: the invitation to Studio until it is closed. */
export function StudioHomeBanner() {
  const { show, first, tlacos, href, close } = useStudioHomeInvite();
  if (!show) return null;
  return (
    <section
      aria-labelledby="studio-home-banner"
      className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-accent via-blue-600 to-blue-900 p-5 text-white shadow-lg sm:p-7"
    >
      <span
        aria-hidden
        className="absolute -top-24 -right-16 -z-10 h-72 w-72 rounded-full bg-white/10"
      />
      <span
        aria-hidden
        className="absolute -bottom-28 left-1/4 -z-10 h-56 w-56 rounded-full bg-white/5"
      />
      <button
        type="button"
        onClick={close}
        aria-label="Cerrar aviso de Tlaco Studio"
        className="absolute top-3 right-3 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
        <div aria-hidden className="hidden shrink-0 sm:block">
          <div className="flex aspect-4/5 w-28 -rotate-6 flex-col justify-between rounded-2xl bg-white p-3 text-slate-900 shadow-2xl">
            <span className="text-[9px] font-bold tracking-widest text-slate-500">
              TU NEGOCIO
            </span>
            <span className="flex h-11 w-11 items-center justify-center self-center rounded-full bg-blue-100 text-blue-700">
              <Package className="h-6 w-6" />
            </span>
            <span className="text-xl leading-none font-bold tracking-tight">
              $120
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 pr-10 sm:pr-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
            <WandSparkles className="h-3.5 w-3.5" aria-hidden />
            Nuevo · Tlaco Studio
          </span>
          <h2
            id="studio-home-banner"
            className="mt-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            {first ? "Haz tu primer anuncio" : "Haz tu siguiente anuncio"}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-white/85 sm:text-base">
            Elige un producto y Studio lo arma con tu precio y tu logo, listo
            para WhatsApp y tu tienda.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end sm:pr-10">
          <span className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/12 px-3 py-2 sm:self-end">
            <Coins className="h-5 w-5 text-amber-300" aria-hidden />
            <span className="text-2xl leading-none font-bold tabular-nums">
              {tlacos}
            </span>
            <span className="text-sm leading-tight font-semibold text-white/85">
              Tlacos
              <br />
              de regalo
            </span>
          </span>
          <Link
            href={href}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-bold text-blue-700 shadow-md transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
          >
            Probar
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** In the home header, the usual way into Studio once the banner is gone. */
export function StudioHomeLink() {
  const { show } = useStudioHomeInvite();
  return show ? null : (
    <StudioActionLink label="Crear publicidad con Studio" wide />
  );
}
