import { PackageCheck, Send } from "lucide-react";

import {
  CategoryChips,
  ItemRow,
  PhoneFooter,
  PhoneHero,
  PhoneLink,
  PhoneStatus,
} from "@/features/landing/components/hero/phone/PhoneParts";

import { HERO_MENU_ITEMS } from "@/features/landing/constants/heroSandbox";
import { formatProductCount, getMenuTotal } from "@/features/landing/helpers/heroSandbox";
import { formatMXN } from "@/lib/loanUtils";

import type { HeroPhoneViewProps } from "@/features/landing/interfaces/heroDemo";

export function MenuView({ sandbox, controls }: HeroPhoneViewProps) {
  const total = getMenuTotal(sandbox);

  if (sandbox.order !== "draft") {
    return (
      <>
        <PhoneHero kicker="Mesa 4" title="Pedido enviado" />
        <PhoneStatus
          icon={PackageCheck}
          title={formatMXN(total)}
          detail={`${formatProductCount(sandbox.cart.length)} · el negocio ya lo está viendo`}
        >
          <PhoneLink
            onClick={() => controls.act({ type: "apply", patch: { order: "draft" } })}
          >
            Hacer otro pedido
          </PhoneLink>
        </PhoneStatus>
        <PhoneFooter label="Ver mi pedido" onClick={controls.next} />
      </>
    );
  }

  const items = HERO_MENU_ITEMS.filter(
    (item) => sandbox.category === "all" || item.category === sandbox.category,
  );
  const cartNames = HERO_MENU_ITEMS.filter((item) => sandbox.cart.includes(item.id)).map(
    (item) => item.name,
  );

  return (
    <>
      <PhoneHero kicker="Mesa 4" title="¿Qué vas a pedir?" />
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2.5">
        <CategoryChips
          active={sandbox.category}
          onSelect={(category) => controls.act({ type: "setCategory", category })}
        />
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              name={item.name}
              price={formatMXN(item.price)}
              added={sandbox.cart.includes(item.id)}
              onToggle={() => controls.act({ type: "toggleItem", id: item.id })}
            />
          ))}
        </div>
        <div className="shrink-0 rounded-xl border border-dashed border-accent/40 bg-accent/6 px-2.5 py-1.5">
          <p className="text-[10px] font-bold text-accent">
            {cartNames.length > 0
              ? `Tu pedido · ${formatProductCount(cartNames.length)}`
              : "Toca un producto para agregarlo"}
          </p>
          {cartNames.length > 0 && (
            <p className="truncate text-[10px] text-muted-foreground">{cartNames.join(", ")}</p>
          )}
        </div>
      </div>
      <PhoneFooter
        label={total > 0 ? `Enviar pedido · ${formatMXN(total)}` : "Agrega un producto"}
        icon={Send}
        disabled={total === 0}
        onClick={() => controls.act({ type: "sendOrder" })}
      />
    </>
  );
}
