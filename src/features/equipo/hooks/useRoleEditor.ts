"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { withRequiredPermissions } from "@/constants/permissionCatalog";
import {
  create as createRole,
  remove as removeRole,
  update as updateRole,
} from "@/services/tenantRolesService";
import { teamKey, tenantRolesKey } from "@/features/equipo/helpers/swrKeys";
import { previewRole, withoutPermission } from "@/features/equipo/helpers/rolePreview";
import { roleLabel } from "@/features/equipo/constants/roleDescriptions";

import type { TenantRoleOption } from "@/services/tenantRolesService";
import type { TeamMember } from "@/types/team";

const ROLE_ORDER = ["owner", "cashier", "member", "waiter", "preparer", "courier"];

function sortRoles(roles: TenantRoleOption[]): TenantRoleOption[] {
  const rank = (r: TenantRoleOption) => {
    const i = ROLE_ORDER.indexOf(r.name);
    return i === -1 ? ROLE_ORDER.length : i;
  };
  return [...roles].sort((a, b) => rank(a) - rank(b) || roleLabel(a.name).localeCompare(roleLabel(b.name)));
}

/** Pick a role, toggle its permissions with a live preview, then save, reset or delete. */
export function useRoleEditor(tenantId: string | null) {
  const rolesSwr = useSWR<TenantRoleOption[]>(tenantId ? tenantRolesKey(tenantId) : null, swrFetcher);
  const teamSwr = useSWR<TeamMember[]>(tenantId ? teamKey(tenantId) : null, swrFetcher);

  const roles = useMemo(() => sortRoles(rolesSwr.data ?? []), [rolesSwr.data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = roles.find((r) => r.id === selectedId) ?? roles[0] ?? null;

  const [draft, setDraft] = useState<{ roleId: string; permissions: string[] } | null>(null);
  const permissions = draft && draft.roleId === selected?.id ? draft.permissions : (selected?.permissions ?? []);
  const dirty = Boolean(draft && selected && draft.roleId === selected.id);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const membersByRole = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of teamSwr.data ?? []) counts.set(m.role_id, (counts.get(m.role_id) ?? 0) + 1);
    return counts;
  }, [teamSwr.data]);

  function select(roleId: string) {
    setSelectedId(roleId);
    setDraft(null);
    setError(null);
    setSaved(false);
  }

  function toggle(key: string, on: boolean) {
    if (!selected) return;
    const next = on ? withRequiredPermissions([...permissions, key]) : withoutPermission(permissions, key);
    setDraft({ roleId: selected.id, permissions: next });
    setSaved(false);
  }

  async function persist(action: () => Promise<TenantRoleOption | void>, selectAfter?: (r: TenantRoleOption | void) => string | null) {
    setSaving(true);
    setError(null);
    try {
      const result = await action();
      await rolesSwr.mutate();
      setDraft(null);
      setSaved(true);
      const next = selectAfter?.(result);
      if (next !== undefined) setSelectedId(next);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el rol.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    loading: rolesSwr.isLoading && !rolesSwr.data,
    roles,
    selected,
    permissions,
    preview: selected ? previewRole(selected.name, permissions) : null,
    dirty,
    saving,
    error,
    saved,
    membersOf: (roleId: string) => membersByRole.get(roleId) ?? 0,
    select,
    toggle,
    discard: () => setDraft(null),
    save: () => selected && tenantId && persist(() => updateRole(tenantId, selected.id, { permissions })),
    reset: () => selected && tenantId && persist(() => updateRole(tenantId, selected.id, { reset: true })),
    rename: (name: string) => selected && tenantId && persist(() => updateRole(tenantId, selected.id, { name })),
    create: (name: string, basePermissions: string[]) =>
      tenantId ? persist(() => createRole(tenantId, name, basePermissions), (r) => (r ? r.id : null)) : Promise.resolve(false),
    remove: () => selected && tenantId && persist(() => removeRole(tenantId, selected.id), () => null),
  };
}

export type RoleEditorController = ReturnType<typeof useRoleEditor>;
