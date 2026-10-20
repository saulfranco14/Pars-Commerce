"use client";

import { PERMISSION_CATALOG, PERMISSION_GROUP_LABELS } from "@/constants/permissionCatalog";
import { roleHasPermission } from "@/lib/auth/permissions";

import type { PermissionGroup } from "@/constants/permissionCatalog";
import type { RoleEditorPartProps } from "@/features/equipo/interfaces/roleEditor";

const GROUPS = Object.keys(PERMISSION_GROUP_LABELS) as PermissionGroup[];
const EDITABLE = PERMISSION_CATALOG.filter((p) => !p.legacy);

export function RolePermissionToggles({ editor }: RoleEditorPartProps) {
  const role = editor.selected;
  if (!role) return null;
  const isOwner = role.name === "owner";

  return (
    <div className="space-y-5">
      {GROUPS.map((group) => (
        <fieldset key={group}>
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {PERMISSION_GROUP_LABELS[group]}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {EDITABLE.filter((p) => p.group === group).map((permission) => {
              const on = roleHasPermission(role.name, editor.permissions, permission.key);
              return (
                <label
                  key={permission.key}
                  className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                    on ? "border-accent/40 bg-accent/5 text-foreground" : "border-border text-muted-foreground"
                  } ${isOwner ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                >
                  <span>{permission.label}</span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={on}
                    disabled={isOwner || editor.saving}
                    onChange={(e) => editor.toggle(permission.key, e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={`relative h-6 w-10 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
                      on ? "bg-accent" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        on ? "translate-x-4.5" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
