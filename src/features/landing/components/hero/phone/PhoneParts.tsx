import { ArrowRight, Check, Plus, Store } from "lucide-react";

import { HERO_MENU_CATEGORIES } from "@/features/landing/constants/heroSandbox";

import type { LucideIcon } from "lucide-react";
import type { HeroMenuCategory } from "@/features/landing/interfaces/heroDemo";

/** Bloque de marca — misma forma que el hero de <CustomerScreenLayout>. */
export function PhoneHero({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div className="shrink-0 rounded-b-2xl bg-accent px-3 pb-3 pt-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-foreground/20 text-accent-foreground">
          <Store className="h-3.5 w-3.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[9px] font-bold uppercase tracking-wider text-accent-foreground/75">
            {kicker}
          </p>
          <p className="truncate text-sm font-bold leading-tight text-accent-foreground">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}

export function PhoneFooter({
  label,
  onClick,
  icon: Icon = ArrowRight,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
}) {
  return (
    <div className="shrink-0 border-t border-border bg-surface p-2.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-bold text-accent-foreground transition-transform hover:bg-accent-hover active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground disabled:active:scale-100"
      >
        <span className="truncate">{label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>
    </div>
  );
}

/** Pantalla de resultado: lo que el cliente ve justo después de actuar. */
export function PhoneStatus({
  icon: Icon,
  title,
  detail,
  tone = "success",
  children,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  tone?: "success" | "muted";
  children?: React.ReactNode;
}) {
  return (
    <div className="animate-hero-row-in flex flex-1 flex-col items-center justify-center gap-2.5 px-4 text-center">
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          tone === "success"
            ? "bg-emerald-500 text-white"
            : "bg-accent/12 text-accent"
        }`}
      >
        <Icon className="h-6 w-6" aria-hidden strokeWidth={2.5} />
      </span>
      <div>
        <p className="text-base font-bold tracking-tight text-foreground">{title}</p>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{detail}</p>
      </div>
      {children}
    </div>
  );
}

export function PhoneLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-8 cursor-pointer rounded-lg px-2 text-[11px] font-semibold text-accent underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {children}
    </button>
  );
}

export function ItemRow({
  name,
  price,
  added,
  onToggle,
}: {
  name: string;
  price: string;
  added: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={added}
      aria-label={`${added ? "Quitar" : "Agregar"} ${name}, ${price}`}
      className={`flex w-full shrink-0 cursor-pointer items-center gap-2 rounded-xl border bg-surface p-2 text-left transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        added ? "border-accent" : "border-border hover:border-accent/40"
      }`}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/12"
        aria-hidden
      >
        <span className="h-3.5 w-3.5 rounded-sm bg-accent/35" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-bold leading-tight text-foreground">
          {name}
        </span>
        <span className="mt-0.5 block text-[11px] font-bold text-accent">{price}</span>
      </span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
          added ? "bg-accent text-accent-foreground" : "bg-accent/12 text-accent"
        }`}
        aria-hidden
      >
        {added ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : (
          <Plus className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}

export function CategoryChips({
  active,
  onSelect,
}: {
  active: HeroMenuCategory;
  onSelect: (category: HeroMenuCategory) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1.5" role="group" aria-label="Categorías">
      {HERO_MENU_CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          aria-pressed={c.id === active}
          className={`min-h-7 cursor-pointer rounded-full px-2.5 text-[10px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            c.id === active
              ? "bg-accent text-accent-foreground"
              : "bg-border-soft text-muted-foreground hover:text-foreground dark:bg-border"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

/** Marco de celular compartido por el lado del cliente y el del negocio. */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-68 touch-manipulation rounded-[1.6rem] border border-border bg-surface-raised p-1.5 shadow-card lg:w-60">
      <div className="relative overflow-hidden rounded-[1.3rem] bg-surface">{children}</div>
    </div>
  );
}
