"use client";

import { useRef, useEffect, useState } from "react";
import { Heart, Shield, Lock, Gift, ChevronDown } from "lucide-react";
import type { SitePageCard } from "@/types/tenantSitePages";

const ICON_OPTIONS: {
  value: SitePageCard["icon"];
  label: string;
  Icon: typeof Heart;
}[] = [
  { value: "heart", label: "Corazón", Icon: Heart },
  { value: "shield", label: "Escudo", Icon: Shield },
  { value: "lock", label: "Candado", Icon: Lock },
  { value: "gift", label: "Regalo", Icon: Gift },
];

interface CardIconSelectorProps {
  value: SitePageCard["icon"] | undefined;
  onChange: (icon: SitePageCard["icon"]) => void;
  id?: string;
}

export function CardIconSelector({ value, onChange, id }: CardIconSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = ICON_OPTIONS.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={selected ? `${selected.label} seleccionado` : "Seleccionar icono"}
        className="input-form flex min-h-[44px] min-w-[180px] cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground transition-colors duration-200 hover:border-accent/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        {selected ? (
          <>
            <selected.Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
            <span className="truncate">{selected.label}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Seleccionar icono</span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-border bg-surface py-1 shadow-lg"
        >
          {ICON_OPTIONS.map(({ value: v, label, Icon }) => (
            <li key={v} role="option" aria-selected={value === v}>
              <button
                type="button"
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition-colors duration-150 hover:bg-accent/10 focus:bg-accent/10 focus:outline-none"
              >
                <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden />
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
