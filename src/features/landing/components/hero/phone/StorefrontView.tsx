import { Check, Plus, ShoppingBag } from "lucide-react";

import {
  PhoneFooter,
  PhoneHero,
  PhoneLink,
  PhoneStatus,
} from "@/features/landing/components/hero/phone/PhoneParts";

import { HERO_STORE_ITEMS } from "@/features/landing/constants/heroSandbox";
import { getStoreTotal } from "@/features/landing/helpers/heroSandbox";
import { formatMXN } from "@/lib/loanUtils";

import type { HeroPhoneViewProps } from "@/features/landing/interfaces/heroDemo";

export function StorefrontView({ sandbox, controls }: HeroPhoneViewProps) {
  const total = getStoreTotal(sandbox);

  if (sandbox.storeOrdered) {
    return (
      <>
        <PhoneHero kicker="Tienda en línea" title="Mi Negocio" />
        <PhoneStatus
          icon={Check}
          title="¡Compra confirmada!"
          detail={`${formatMXN(total)} · te enviamos el comprobante a tu correo`}
        >
          <PhoneLink
            onClick={() => controls.act({ type: "apply", patch: { storeOrdered: false } })}
          >
            Seguir comprando
          </PhoneLink>
        </PhoneStatus>
        <PhoneFooter label={`Siguiente: ${controls.nextLabel}`} onClick={controls.next} />
      </>
    );
  }

  return (
    <>
      <PhoneHero kicker="Tienda en línea" title="Mi Negocio" />
      <div className="grid flex-1 auto-rows-min grid-cols-2 content-center gap-2 p-2.5">
        {HERO_STORE_ITEMS.map((item) => {
          const added = sandbox.storeCart.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => controls.act({ type: "toggleStoreItem", id: item.id })}
              aria-pressed={added}
              aria-label={`${added ? "Quitar" : "Agregar"} ${item.name}, ${formatMXN(item.price)}`}
              className={`relative cursor-pointer overflow-hidden rounded-xl border bg-surface text-left transition-colors active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                added ? "border-accent" : "border-border hover:border-accent/40"
              }`}
            >
              <span className="flex h-12 items-center justify-center bg-accent/12" aria-hidden>
                <span className="h-5 w-5 rounded-md bg-accent/35" />
              </span>
              <span
                className={`absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full ${
                  added ? "bg-accent text-accent-foreground" : "bg-surface text-accent"
                }`}
                aria-hidden
              >
                {added ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </span>
              <span className="block p-1.5">
                <span className="block truncate text-[10px] font-bold leading-tight text-foreground">
                  {item.name}
                </span>
                <span className="mt-0.5 block text-[11px] font-bold text-accent">
                  {formatMXN(item.price)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <PhoneFooter
        label={total > 0 ? `Comprar · ${formatMXN(total)}` : "Elige un producto"}
        icon={ShoppingBag}
        disabled={total === 0}
        onClick={() => controls.act({ type: "placeStoreOrder" })}
      />
    </>
  );
}
