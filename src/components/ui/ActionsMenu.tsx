"use client";

import { useEffect, useRef, useState } from "react";

import { MoreVertical } from "lucide-react";

import type { LucideIcon } from "lucide-react";

export interface ActionsMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ActionsMenuProps {
  items: ActionsMenuItem[];
  "aria-label": string;
}

/**
 * A "⋯" overflow menu for secondary actions on list/card items — keeps a
 * card from having to show every action as its own button (see
 * DESIGN_SYSTEM.md — cards get 1-2 visible actions + this menu for the rest).
 * Closes on click-outside or Escape. 44px touch target throughout.
 */
export function ActionsMenu({ items, "aria-label": ariaLabel }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-border-soft/60 hover:text-foreground"
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`flex min-h-11 w-full cursor-pointer items-center gap-2.5 px-3.5 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "text-foreground hover:bg-border-soft/60"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
