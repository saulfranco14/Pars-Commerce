"use client";

import type { SettingToggleCardProps } from "@/features/configuracion/interfaces/paymentsAndDelivery";

/** One way to charge or hand over: a switch, and its details only while it is on. */
export function SettingToggleCard({ icon: Icon, title, description, enabled, disabled, onToggle, children }: SettingToggleCardProps) {
  const toggleable = typeof enabled === "boolean" && Boolean(onToggle);
  return (
    <section
      className={`rounded-2xl border p-4 ${enabled ? "border-accent/35 bg-accent/3" : "border-border bg-surface"} ${disabled ? "opacity-50" : ""}`}
    >
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-foreground">{title}</h3>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
            {toggleable ? (
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${enabled ? "Desactivar" : "Activar"} ${title}`}
                disabled={disabled}
                onClick={() => onToggle?.(!enabled)}
                className={`h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition disabled:cursor-not-allowed ${enabled ? "bg-accent" : "bg-muted"}`}
              >
                <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${enabled ? "translate-x-5" : ""}`} />
              </button>
            ) : null}
          </div>
          {(!toggleable || enabled) && children ? <div className="mt-4 border-t border-border/60 pt-4">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
