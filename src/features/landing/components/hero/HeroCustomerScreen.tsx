import { Check, PackageCheck, Store } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import { sceneTotal } from "@/features/landing/helpers/sceneTotal";
import styles from "@/features/landing/components/hero/heroStage.module.css";

import type { HeroScene } from "@/features/landing/interfaces/heroScene";

/** The customer's order screen, shaped like `CustomerScreenLayout` in `/q/[token]`. */
export function HeroCustomerScreen({ scene }: { scene: HeroScene }) {
  const total = formatCurrency(sceneTotal(scene));

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <div className="shrink-0 rounded-b-3xl bg-accent px-4 pb-4 pt-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
            <Store className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-white/75">
              {scene.place}
            </span>
            <span className="block truncate text-base font-bold leading-tight text-white">
              Tu pedido
            </span>
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2 px-3 pt-3">
        {scene.items.map((item, i) => (
          <li
            key={item.name}
            className={`${styles.item} flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5`}
            style={{ animationDelay: `${0.4 + i * 0.15}s` }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/12">
              <span className="h-3.5 w-3.5 rounded-sm bg-accent/35" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold">{item.name}</span>
              <span className="block text-xs font-bold text-accent">
                {formatCurrency(item.price)}
              </span>
            </span>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
            </span>
          </li>
        ))}
      </ul>

      <p
        className={`${styles.ready} mx-3 mt-2.5 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700`}
      >
        <PackageCheck className="h-3.5 w-3.5" aria-hidden />
        Listo · ya puedes pagar
      </p>

      <div className="mt-auto border-t border-slate-200 bg-white px-3.5 pb-5 pt-3">
        <p className="text-[11px] text-slate-500">Total</p>
        <p className="text-3xl font-bold tracking-tight tabular-nums">{total}</p>
        <span
          className={`${styles.pay} mt-2.5 flex min-h-10 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white`}
        >
          Pagar {total}
        </span>
      </div>
    </div>
  );
}
