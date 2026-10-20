"use client";

import { Eye, LogIn } from "lucide-react";

import type { RoleEditorPartProps } from "@/features/equipo/interfaces/roleEditor";

export function RolePreviewPanel({ editor }: RoleEditorPartProps) {
  const preview = editor.preview;
  if (!preview) return null;

  return (
    <aside className="rounded-2xl border border-border bg-surface-raised p-4" aria-label="Así lo verá">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <Eye className="h-4 w-4" aria-hidden />
        Así lo verá
      </p>
      <p className="mt-3 flex items-center gap-2 text-sm text-foreground">
        <LogIn className="h-4 w-4 text-accent" aria-hidden />
        Entra a <strong>{preview.landing ?? "nada todavía"}</strong>
      </p>
      {preview.menu.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Sin permisos, no verá ninguna sección.</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {preview.menu.map((label) => (
            <li key={label} className="rounded-lg bg-surface px-3 py-2 text-sm text-foreground">
              {label}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
