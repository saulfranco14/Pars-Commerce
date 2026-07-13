"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface FabAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
}

interface FabSpeedDialProps {
  actions: FabAction[];
  "aria-label": string;
}

/**
 * Mobile FAB that expands into a small menu of actions (speed-dial) — for
 * screens with more than one create action (e.g. Mesas: "Agregar mesa" +
 * "Tomar pedido"). Avoids duplicating buttons in header AND FAB. Mobile-only
 * (`md:hidden`); on desktop those actions live in the page header.
 */
export function FabSpeedDial({
  actions,
  "aria-label": ariaLabel,
}: FabSpeedDialProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Scrim */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/30"
        />
      )}

      <div
        className="fixed right-4 z-40 flex flex-col items-end gap-2"
        style={{ bottom: "max(5.5rem, calc(5.5rem + env(safe-area-inset-bottom)))" }}
      >
        {/* Action items */}
        {open &&
          actions.map((action) => {
            const content = (
              <>
                <span className="rounded-lg bg-foreground/90 px-2.5 py-1 text-xs font-bold text-background shadow">
                  {action.label}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent shadow-lg ring-1 ring-border">
                  <action.icon className="h-5 w-5" strokeWidth={2.5} />
                </span>
              </>
            );
            const cls =
              "flex items-center gap-2 transition-transform active:scale-95";
            return action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className={cls}
                onClick={() => setOpen(false)}
              >
                {content}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                className={cls}
                onClick={() => {
                  setOpen(false);
                  action.onClick?.();
                }}
              >
                {content}
              </button>
            );
          })}

        {/* Trigger */}
        <button
          type="button"
          aria-label={ariaLabel}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {open ? (
            <X className="h-6 w-6" strokeWidth={2.5} />
          ) : (
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}
