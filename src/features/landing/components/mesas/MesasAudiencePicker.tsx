"use client";

import { useState } from "react";

import { MESAS_AUDIENCES } from "@/features/landing/constants/mesas";

/**
 * "¿Esto es para mi negocio?" — el prospecto se identifica tocando su rubro y
 * ve el ejemplo concreto de su caso. Deja claro de entrada que el QR de mesas
 * es multinegocio y no sólo para restaurantes (CLAUDE.md §6).
 */
export function MesasAudiencePicker() {
  const [activeKey, setActiveKey] = useState(MESAS_AUDIENCES[0].key);
  const active =
    MESAS_AUDIENCES.find((a) => a.key === activeKey) ?? MESAS_AUDIENCES[0];

  return (
    <div className="mt-12 rounded-2xl border border-border bg-surface-raised p-5 sm:p-8">
      <p className="text-center text-sm font-semibold text-foreground">
        ¿Esto funciona para mi negocio? Toca el tuyo.
      </p>

      <div
        role="tablist"
        aria-label="Tipos de negocio"
        className="mt-5 flex flex-wrap justify-center gap-2"
      >
        {MESAS_AUDIENCES.map(({ key, label, icon: Icon }) => {
          const isActive = key === activeKey;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(key)}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
                isActive
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-accent/40 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <p
        key={active.key}
        className="animate-fade-in-up mx-auto mt-6 max-w-xl text-center text-[15px] leading-relaxed text-muted-foreground"
      >
        <span className="font-semibold text-foreground">{active.label}:</span>{" "}
        {active.example}
      </p>
    </div>
  );
}
