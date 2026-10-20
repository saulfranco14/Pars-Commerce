"use client";

import { Crown, Users } from "lucide-react";

import { roleLabel } from "@/features/equipo/constants/roleDescriptions";

import type { RoleEditorPartProps } from "@/features/equipo/interfaces/roleEditor";

export function RoleList({ editor }: RoleEditorPartProps) {
  return (
    <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Roles">
      {editor.roles.map((role) => {
        const active = role.id === editor.selected?.id;
        const count = editor.membersOf(role.id);
        return (
          <li key={role.id} className="shrink-0 lg:shrink">
            <button
              type="button"
              onClick={() => editor.select(role.id)}
              aria-current={active ? "true" : undefined}
              className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                active ? "border-accent bg-accent/10" : "border-border bg-surface hover:bg-border-soft/60"
              }`}
            >
              {role.name === "owner" ? (
                <Crown className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              ) : (
                <Users className={`h-4 w-4 shrink-0 ${active ? "text-accent" : "text-muted-foreground"}`} aria-hidden />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{roleLabel(role.name)}</span>
              <span className="shrink-0 rounded-full bg-border-soft px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {count}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
