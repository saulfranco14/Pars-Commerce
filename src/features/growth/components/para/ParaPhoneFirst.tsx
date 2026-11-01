import Image from "next/image";
import { Store } from "lucide-react";

import { StorePurchaseSteps } from "@/features/sitio/components/home/StorePurchaseSteps";
import { ParaActions } from "@/features/growth/components/para/ParaActions";
import { ParaBenefits } from "@/features/growth/components/para/ParaBenefits";
import { ParaObjections } from "@/features/growth/components/para/ParaObjections";
import { ParaThemeFrame } from "@/features/growth/components/para/ParaThemeFrame";

import { itemInitials } from "@/features/growth/helpers/paraSender";
import { PARA_ACTIVATION_STEPS } from "@/features/growth/constants/para";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { ParaInteractiveProps } from "@/features/growth/interfaces/para";

/** Design «Tienda primero»: their name and their store on a phone in the first screen, with «Activar» right there. */
export function ParaPhoneFirst({ token, data }: ParaInteractiveProps) {
  const preview = data.items.slice(0, 4);
  const who = data.sender ? `${data.sender.name}, de Tlaco,` : "El equipo de Tlaco";

  return (
    <ParaThemeFrame>
      <div className="mx-auto w-full max-w-6xl space-y-12 px-4 pb-28 pt-6 sm:space-y-16 sm:px-6 sm:pb-16 sm:pt-10">
        <section data-para-section="intro" className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-12">
          <div className="grid gap-5">
            <p className="text-sm font-semibold text-(--store-ink-2)">{who} la preparó para usted</p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-balance text-(--store-ink) sm:text-5xl">
              {data.businessName}, su tienda en línea ya está lista.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-(--store-ink-2)">
              Así la ven sus clientes en su celular, ya con productos de ejemplo. Activarla es gratis y toma un par de minutos.
            </p>
            <div className="max-w-md">
              <ParaActions claimUrl={data.claimUrl} helpUrl={data.helpUrl} helpLabel={data.helpLabel} layout="intro" />
            </div>
          </div>

          <div data-para-section="tienda" className="mx-auto w-full max-w-xs">
            <div className="rounded-[2.75rem] border-[10px] border-(--store-ink) bg-(--store-canvas) p-3 shadow-2xl">
              <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-(--store-hairline)" aria-hidden />
              <div className="flex items-center gap-2 rounded-2xl bg-(--store-surface) px-3 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Store className="h-4 w-4" aria-hidden />
                </span>
                <span className="truncate text-sm font-bold text-(--store-ink)">{data.businessName}</span>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {preview.map((item) => (
                  <li key={item.id} data-para-item={item.name} className="overflow-hidden rounded-xl bg-(--store-surface) ring-1 ring-(--store-hairline)">
                    <span className="relative flex aspect-square items-center justify-center bg-accent/8 text-2xl font-bold text-accent">
                      {item.imageUrl ? <Image src={item.imageUrl} alt={item.name} fill priority sizes="140px" className="object-cover" /> : <span aria-hidden>{itemInitials(item.name)}</span>}
                    </span>
                    <span className="block truncate px-2 pt-1.5 text-xs font-semibold text-(--store-ink)">{item.name}</span>
                    <span className="block px-2 pb-2 text-xs font-bold tabular-nums text-(--store-ink)">{formatCurrency(item.price)}</span>
                  </li>
                ))}
              </ul>
              <span aria-hidden className="mt-3 flex min-h-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">
                Hacer pedido
              </span>
            </div>
          </div>
        </section>

        <ParaBenefits />

        <StorePurchaseSteps steps={PARA_ACTIVATION_STEPS} title="Qué pasa al activarla" subtitle="Su tienda queda lista en un par de minutos." />

        <ParaObjections token={token} data={data} />
      </div>
    </ParaThemeFrame>
  );
}
