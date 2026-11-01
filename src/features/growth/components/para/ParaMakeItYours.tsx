"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, MessageCircle, Store } from "lucide-react";

import { useParaCustomize } from "@/features/growth/hooks/useParaCustomize";
import { StorePurchaseSteps } from "@/features/sitio/components/home/StorePurchaseSteps";
import { ParaBenefits } from "@/features/growth/components/para/ParaBenefits";
import { ParaObjections } from "@/features/growth/components/para/ParaObjections";
import { ParaThemeFrame } from "@/features/growth/components/para/ParaThemeFrame";

import { itemInitials } from "@/features/growth/helpers/paraSender";
import { PARA_ACTIVATION_STEPS } from "@/features/growth/constants/para";
import { PARA_CUSTOMIZE_STEPS, PARA_STORE_COLORS, PARA_STORE_HOURS } from "@/features/growth/constants/paraCustomize";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { ParaInteractiveProps } from "@/features/growth/interfaces/para";

function StepTitle({ number, title, done }: { number: number; title: string; done: boolean }) {
  return (
    <p className="flex items-center gap-2.5 text-base font-bold text-(--store-ink)">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${done ? "bg-emerald-600 text-white" : "bg-(--store-well) text-(--store-ink-2)"}`}>
        {done ? <Check className="h-4 w-4" aria-hidden /> : number}
      </span>
      {title}
    </p>
  );
}

/** Design «Hazla tuya»: three quick choices change their store live, and the last step is activating it. */
export function ParaMakeItYours({ token, data }: ParaInteractiveProps) {
  const custom = useParaCustomize(data.claimUrl);
  const { choice } = custom;
  const featured = data.items[0] ?? null;
  const preview = data.items.slice(0, 4);
  const color = PARA_STORE_COLORS.find((option) => option.key === choice.color)?.hex ?? PARA_STORE_COLORS[0].hex;
  const hours = PARA_STORE_HOURS.find((option) => option.key === choice.hours)?.label ?? null;
  const priceOf = (index: number, price: number) => (index === 0 && choice.price !== null ? choice.price : price);
  const who = data.sender ? `${data.sender.name}, de Tlaco,` : "El equipo de Tlaco";

  return (
    <ParaThemeFrame>
      <div className="mx-auto w-full max-w-6xl space-y-12 px-4 pb-28 pt-6 sm:space-y-16 sm:px-6 sm:pb-16 sm:pt-10">
        <section data-para-section="intro" className="grid gap-3">
          <p className="text-sm font-semibold text-(--store-ink-2)">{who} la preparó para usted</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-balance text-(--store-ink) sm:text-5xl">
            {data.businessName}, póngala a su gusto en 20 segundos.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-(--store-ink-2)">Elija tres cosas y vea cómo cambia su tienda. Al terminar, la activa gratis tal como la dejó.</p>
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12">
          <div className="order-2 grid gap-4 lg:order-1">
            <div className="sticky top-18 z-10 flex items-center gap-2 rounded-2xl px-3 py-2.5 text-white shadow-lg transition-colors lg:hidden" style={{ backgroundColor: color }} aria-hidden>
              <Store className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{data.businessName}</span>
              <span className="shrink-0 text-xs font-semibold opacity-90">
                {[hours, featured && choice.price !== null ? `${featured.name} ${formatCurrency(choice.price)}` : null].filter(Boolean).join(" · ") || "Así va su tienda"}
              </span>
            </div>
            <div className="grid gap-1.5" aria-live="polite">
              <p className="text-sm font-semibold text-(--store-ink-2)">{custom.done} de {PARA_CUSTOMIZE_STEPS} listas</p>
              <div className="h-2 overflow-hidden rounded-full bg-(--store-well)">
                <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${(custom.done / PARA_CUSTOMIZE_STEPS) * 100}%` }} />
              </div>
            </div>

            <fieldset className="grid gap-3 rounded-(--store-radius) bg-(--store-surface) p-5 ring-1 ring-(--store-hairline)">
              <legend className="sr-only">Color de su tienda</legend>
              <StepTitle number={1} title="El color de su tienda" done={choice.color !== null} />
              <div className="flex flex-wrap gap-3">
                {PARA_STORE_COLORS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={choice.color === option.key}
                    aria-label={option.label}
                    onClick={() => custom.setColor(option.key)}
                    className={`h-12 w-12 rounded-full ring-offset-2 transition ${choice.color === option.key ? "ring-4 ring-(--store-ink)" : "ring-1 ring-(--store-hairline) hover:scale-105"}`}
                    style={{ backgroundColor: option.hex }}
                  />
                ))}
              </div>
            </fieldset>

            {featured ? (
              <div className="grid gap-3 rounded-(--store-radius) bg-(--store-surface) p-5 ring-1 ring-(--store-hairline)">
                <StepTitle number={2} title={`¿A cuánto vende «${featured.name}»?`} done={choice.price !== null} />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-(--store-hairline) bg-(--store-canvas) px-4 focus-within:ring-2 focus-within:ring-accent/40">
                    <span className="text-lg font-bold text-(--store-ink-2)">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      aria-label={`Precio de ${featured.name}`}
                      placeholder={String(featured.price)}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (value > 0) custom.setPrice(value);
                      }}
                      className="w-28 bg-transparent text-lg font-bold tabular-nums text-(--store-ink) outline-none"
                    />
                  </label>
                  {choice.price === null ? (
                    <button type="button" onClick={() => custom.setPrice(featured.price)} className="min-h-12 rounded-2xl px-4 text-sm font-semibold text-(--store-ink-2) hover:bg-(--store-well)">
                      Se queda en {formatCurrency(featured.price)}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <fieldset className="grid gap-3 rounded-(--store-radius) bg-(--store-surface) p-5 ring-1 ring-(--store-hairline)">
              <legend className="sr-only">Horario</legend>
              <StepTitle number={featured ? 3 : 2} title="¿En qué horario atiende?" done={choice.hours !== null} />
              <div className="flex flex-wrap gap-2">
                {PARA_STORE_HOURS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={choice.hours === option.key}
                    onClick={() => custom.setHours(option.key)}
                    className={`min-h-12 rounded-2xl px-4 text-sm font-semibold transition ${choice.hours === option.key ? "bg-(--store-ink) text-(--store-surface)" : "bg-(--store-well) text-(--store-ink) hover:ring-1 hover:ring-(--store-hairline)"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className={`grid gap-3 rounded-(--store-radius) p-5 ${custom.complete ? "bg-emerald-50 ring-1 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900" : "bg-(--store-surface) ring-1 ring-(--store-hairline)"}`}>
              <p className="text-lg font-bold text-(--store-ink)">{custom.complete ? "¡Así queda su tienda!" : "Puede activarla cuando quiera"}</p>
              <p className="text-sm text-(--store-ink-2)">
                {custom.complete ? "Se activa con lo que eligió. Después cambia precios, fotos y horarios cuando quiera." : "Lo que elija aquí se guarda al activarla; lo demás lo ajusta después."}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={custom.claimHref}
                  data-para-action="claim:intro"
                  className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 active:scale-[0.99] sm:flex-none"
                >
                  {custom.complete ? "Guardar y activar mi tienda" : "Activar mi tienda gratis"}
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
                {data.helpUrl ? (
                  <a
                    href={data.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-para-action="help:intro"
                    className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-(--store-hairline) bg-(--store-surface) px-4 text-sm font-semibold text-(--store-ink)"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />{data.helpLabel}
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div data-para-section="tienda" className="order-1 mx-auto w-full max-w-56 lg:sticky lg:top-24 lg:order-2 lg:max-w-xs">
            <div className="rounded-[2.75rem] border-[10px] border-(--store-ink) bg-(--store-canvas) p-3 shadow-2xl">
              <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-(--store-hairline)" aria-hidden />
              <div className="flex items-center gap-2 rounded-2xl px-3 py-2.5 text-white transition-colors" style={{ backgroundColor: color }}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Store className="h-4 w-4" aria-hidden />
                </span>
                <span className="truncate text-sm font-bold">{data.businessName}</span>
              </div>
              {hours ? (
                <p className="mt-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-(--store-ink-2)">
                  <Clock className="h-3.5 w-3.5" aria-hidden />Abierto · {hours}
                </p>
              ) : null}
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {preview.map((item, index) => (
                  <li key={item.id} data-para-item={item.name} className="overflow-hidden rounded-xl bg-(--store-surface) ring-1 ring-(--store-hairline)">
                    <span className="relative flex aspect-square items-center justify-center text-2xl font-bold transition-colors" style={{ color, backgroundColor: `${color}14` }}>
                      {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill sizes="120px" className="object-cover" /> : <span aria-hidden>{itemInitials(item.name)}</span>}
                    </span>
                    <span className="block truncate px-2 pt-1.5 text-xs font-semibold text-(--store-ink)">{item.name}</span>
                    <span className={`block px-2 pb-2 text-xs font-bold tabular-nums ${index === 0 && choice.price !== null ? "text-emerald-700" : "text-(--store-ink)"}`}>
                      {formatCurrency(priceOf(index, item.price))}
                    </span>
                  </li>
                ))}
              </ul>
              <span aria-hidden className="mt-3 flex min-h-10 items-center justify-center rounded-xl text-sm font-bold text-white transition-colors" style={{ backgroundColor: color }}>
                Hacer pedido
              </span>
            </div>
            <p className="mt-3 text-center text-xs text-(--store-ink-2)">Así la ven sus clientes. Cambia mientras elige.</p>
          </div>
        </div>

        <ParaBenefits />
        <StorePurchaseSteps steps={PARA_ACTIVATION_STEPS} title="Qué pasa al activarla" subtitle="Su tienda queda lista en un par de minutos." />
        <ParaObjections token={token} data={data} />
      </div>
    </ParaThemeFrame>
  );
}
