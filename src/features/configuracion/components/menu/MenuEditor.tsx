"use client";

import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Lock } from "lucide-react";

import { MenuSwitch } from "@/features/configuracion/components/menu/MenuSwitch";

import { orderedGroupItems, orderedGroups } from "@/constants/dashboardMenu";

import type { MenuEditorProps } from "@/features/configuracion/interfaces/menuEditor";

const segment =
  "inline-flex h-11 w-10 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:bg-border-soft/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

/**
 * One card per module: the header moves or switches the whole module, each
 * row moves or switches one entry. Built for a phone first.
 */
export function MenuEditor({ editor }: MenuEditorProps) {
  const hidden = new Set(editor.prefs.hidden);
  const groups = orderedGroups(editor.prefs);

  return (
    <div className="space-y-3">
      {groups.map((group, groupIndex) => {
        const items = orderedGroupItems(group.key, editor.prefs);
        const visibleCount = items.filter((i) => !hidden.has(i.path)).length;
        const switchable = items.filter((i) => !i.locked);
        const anyVisible = switchable.some((i) => !hidden.has(i.path));
        const allVisible = switchable.every((i) => !hidden.has(i.path));

        return (
          <section
            key={group.key}
            aria-labelledby={`menu-${group.key}`}
            className={`overflow-hidden rounded-2xl border bg-surface shadow-sm transition-opacity ${
              anyVisible ? "border-border" : "border-dashed border-border opacity-80"
            }`}
          >
            <header className="flex items-center gap-2 border-b border-border-soft bg-border-soft/40 py-2 pl-4 pr-2">
              <div className="min-w-0 flex-1">
                <h2 id={`menu-${group.key}`} className="truncate text-sm font-bold text-foreground">
                  {group.label}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {visibleCount === items.length ? "Todo visible" : `${visibleCount} de ${items.length} visibles`}
                </p>
              </div>
              <div className="inline-flex shrink-0 divide-x divide-border overflow-hidden rounded-xl border border-border bg-surface">
                <button
                  type="button"
                  onClick={() => editor.moveGroup(group.key, -1)}
                  disabled={groupIndex === 0 || editor.saving}
                  aria-label={`Subir el módulo ${group.label}`}
                  title="Subir el módulo completo"
                  className={segment}
                >
                  <ChevronsUp className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => editor.moveGroup(group.key, 1)}
                  disabled={groupIndex === groups.length - 1 || editor.saving}
                  aria-label={`Bajar el módulo ${group.label}`}
                  title="Bajar el módulo completo"
                  className={segment}
                >
                  <ChevronsDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
              <MenuSwitch
                size="lg"
                checked={anyVisible}
                partial={anyVisible && !allVisible}
                disabled={editor.saving}
                label={`${anyVisible ? "Ocultar" : "Mostrar"} todo ${group.label}`}
                onChange={() => editor.toggleGroup(group.key)}
              />
            </header>

            <ul className="divide-y divide-border-soft">
              {items.map((item, index) => {
                const Icon = item.icon;
                const visible = !hidden.has(item.path);
                return (
                  <li key={item.path} className="flex items-center gap-2 py-1.5 pl-4 pr-2">
                    <Icon className={`h-4 w-4 shrink-0 ${visible ? "text-accent" : "text-muted-foreground/60"}`} aria-hidden />
                    <span
                      className={`min-w-0 flex-1 truncate text-sm font-medium ${
                        visible ? "text-foreground" : "text-muted-foreground line-through"
                      }`}
                    >
                      {item.label}
                    </span>
                    <div className="inline-flex shrink-0 divide-x divide-border overflow-hidden rounded-xl border border-border">
                      <button
                        type="button"
                        onClick={() => editor.move(group.key, item.path, -1)}
                        disabled={index === 0 || editor.saving}
                        aria-label={`Subir ${item.label}`}
                        className={segment}
                      >
                        <ChevronUp className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.move(group.key, item.path, 1)}
                        disabled={index === items.length - 1 || editor.saving}
                        aria-label={`Bajar ${item.label}`}
                        className={segment}
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    {item.locked ? (
                      <span className="inline-flex min-h-11 min-w-12 shrink-0 items-center justify-center text-muted-foreground" title="Siempre visible">
                        <Lock className="h-4 w-4" aria-label="Siempre visible" />
                      </span>
                    ) : (
                      <MenuSwitch
                        checked={visible}
                        disabled={editor.saving}
                        label={`${visible ? "Ocultar" : "Mostrar"} ${item.label}`}
                        onChange={() => editor.toggle(item.path)}
                      />
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
