"use client";

import { ArrowDown, ArrowUp, Lock } from "lucide-react";

import { MENU_GROUPS, orderedGroupItems } from "@/constants/dashboardMenu";

import type { MenuEditorProps } from "@/features/configuracion/interfaces/menuEditor";

const arrowButton =
  "inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30";

/** The business's menu, group by group: arrows reorder, the switch shows or hides. */
export function MenuEditor({ editor }: MenuEditorProps) {
  const hidden = new Set(editor.prefs.hidden);

  return (
    <div className="space-y-4">
      {MENU_GROUPS.map((group) => {
        const items = orderedGroupItems(group.key, editor.prefs);
        return (
          <section key={group.key} className="rounded-2xl border border-border bg-surface p-4" aria-labelledby={`menu-${group.key}`}>
            <h2 id={`menu-${group.key}`} className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </h2>
            <ul className="space-y-2">
              {items.map((item, index) => {
                const Icon = item.icon;
                const visible = !hidden.has(item.path);
                return (
                  <li
                    key={item.path}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                      visible ? "border-border bg-surface" : "border-dashed border-border bg-border-soft/40"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${visible ? "text-accent" : "text-muted-foreground"}`} aria-hidden />
                    <span className={`min-w-0 flex-1 truncate text-sm font-medium ${visible ? "text-foreground" : "text-muted-foreground line-through"}`}>
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => editor.move(group.key, item.path, -1)}
                      disabled={index === 0 || editor.saving}
                      aria-label={`Subir ${item.label}`}
                      className={arrowButton}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor.move(group.key, item.path, 1)}
                      disabled={index === items.length - 1 || editor.saving}
                      aria-label={`Bajar ${item.label}`}
                      className={arrowButton}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    {item.locked ? (
                      <span className="inline-flex h-11 w-12 shrink-0 items-center justify-center text-muted-foreground" title="Siempre visible">
                        <Lock className="h-4 w-4" aria-label="Siempre visible" />
                      </span>
                    ) : (
                      <label className="inline-flex h-11 w-12 shrink-0 cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={visible}
                          disabled={editor.saving}
                          onChange={() => editor.toggle(item.path)}
                          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${item.label}`}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className={`relative h-6 w-10 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
                            visible ? "bg-accent" : "bg-border"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                              visible ? "translate-x-4.5" : "translate-x-0.5"
                            }`}
                          />
                        </span>
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
