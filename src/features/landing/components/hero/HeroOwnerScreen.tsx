import {
  Bike,
  ChevronDown,
  ClipboardList,
  Home,
  Inbox,
  ListChecks,
  Menu,
  MoreHorizontal,
  Package,
  PackageCheck,
  Wallet,
} from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";

import { formatCurrency } from "@/features/qr/helpers/format";
import { sceneTotal } from "@/features/landing/helpers/sceneTotal";
import styles from "@/features/landing/components/hero/heroStage.module.css";

import type { HeroScene } from "@/features/landing/interfaces/heroScene";

/** Same tabs and bottom bar as the owner's «Mi trabajo» screen on mobile. */
const TABS = [
  { label: "Recepción", icon: Inbox },
  { label: "Mis pedidos", icon: ClipboardList },
  { label: "Preparación", icon: PackageCheck },
  { label: "Entregas", icon: Bike },
  { label: "Caja", icon: Wallet },
] as const;

const NAV = [
  { label: "Inicio", icon: Home },
  { label: "Mi trabajo", icon: ListChecks },
  { label: "Productos", icon: Package },
  { label: "Órdenes", icon: ClipboardList },
  { label: "Más", icon: MoreHorizontal },
] as const;

function Group({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
      <span className="text-xs font-bold">{title}</span>
      <span className="flex items-center gap-1.5">
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
          {count}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-500" aria-hidden />
      </span>
    </div>
  );
}

export function HeroOwnerScreen({ scene }: { scene: HeroScene }) {
  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-200 bg-white px-3.5 pb-2.5 pt-7">
        <Menu className="h-4 w-4 text-slate-700" aria-hidden />
        <TlacoLogo size="sm" />
      </div>

      <div className="m-2.5 grid shrink-0 grid-cols-5 gap-0.5 rounded-2xl border border-slate-200 bg-white p-1">
        {TABS.map(({ label, icon: Icon }, i) => (
          <span
            key={label}
            className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[7px] font-semibold ${
              i === 0 ? "bg-accent text-white" : "text-slate-600"
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2 px-2.5">
        <div className="px-0.5">
          <p className="text-base font-bold leading-tight">Recepción</p>
          <p className="text-[10px] text-slate-500">Acepta los pedidos que llegan y reparte el trabajo.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">Solicitudes nuevas</span>
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-600">
                0
                <span
                  className={`${styles.badge} absolute inset-0 flex items-center justify-center rounded-full bg-accent text-white`}
                >
                  1
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 rotate-180 text-slate-500" aria-hidden />
            </span>
          </div>
          <div
            className={`${styles.newOrder} mt-2.5 rounded-xl border border-accent/40 bg-accent/8 p-2.5`}
          >
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="min-w-0 truncate">
                <strong>{scene.place}</strong> <span className="text-slate-500">· ahora</span>
              </span>
              <strong className="tabular-nums">{formatCurrency(sceneTotal(scene))}</strong>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
              <span>{scene.items.length} productos</span>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
                Pagado
              </span>
            </div>
          </div>
        </div>

        <Group title="Sin asignar" count={0} />
        <Group title="Asignados" count={2} />
      </div>

      <nav className="mt-auto grid shrink-0 grid-cols-5 border-t border-slate-200 bg-white pb-4 pt-2" aria-hidden>
        {NAV.map(({ label, icon: Icon }, i) => (
          <span
            key={label}
            className={`flex flex-col items-center gap-0.5 text-[8px] font-semibold ${
              i === 1 ? "text-accent" : "text-slate-500"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}
