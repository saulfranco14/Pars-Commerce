"use client";

import { useState } from "react";
import { mutate } from "swr";

import { useActiveTenant } from "@/stores/useTenantStore";
import { update as updateTenant } from "@/services/tenantsService";
import {
  menuPreferencesOf,
  orderedGroupItems,
  orderedGroups,
} from "@/constants/dashboardMenu";

import type { MenuGroupKey, MenuPreferences } from "@/constants/dashboardMenu";

const EMPTY: MenuPreferences = { groups: [], order: [], hidden: [] };

/** Draft of the business menu: reorder within a group, show or hide, then save for everyone. */
export function useMenuEditor() {
  const tenant = useActiveTenant();
  const saved = menuPreferencesOf(tenant?.settings);
  const [draft, setDraft] = useState<MenuPreferences | null>(null);
  const prefs = draft ?? saved;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function edit(next: MenuPreferences) {
    setDraft(next);
    setDone(false);
  }

  /** Order is stored as every path, group by group, so a move never loses the rest. */
  function move(group: MenuGroupKey, path: string, delta: -1 | 1) {
    const items = orderedGroupItems(group, prefs).map((i) => i.path);
    const from = items.indexOf(path);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= items.length) return;
    [items[from], items[to]] = [items[to], items[from]];
    const order = orderedGroups(prefs).flatMap((g) =>
      g.key === group ? items : orderedGroupItems(g.key, prefs).map((i) => i.path),
    );
    edit({ ...prefs, order });
  }

  /** Moves a whole group (header and all its entries) up or down the menu. */
  function moveGroup(group: MenuGroupKey, delta: -1 | 1) {
    const keys = orderedGroups(prefs).map((g) => g.key);
    const from = keys.indexOf(group);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= keys.length) return;
    [keys[from], keys[to]] = [keys[to], keys[from]];
    edit({ ...prefs, groups: keys });
  }

  /** Whole module on or off; a locked entry (Configuración) always stays. */
  function toggleGroup(group: MenuGroupKey) {
    const paths = orderedGroupItems(group, prefs)
      .filter((i) => !i.locked)
      .map((i) => i.path);
    const anyVisible = paths.some((p) => !prefs.hidden.includes(p));
    const others = prefs.hidden.filter((p) => !paths.includes(p));
    edit({ ...prefs, hidden: anyVisible ? [...others, ...paths] : others });
  }

  function toggle(path: string) {
    const hidden = prefs.hidden.includes(path) ? prefs.hidden.filter((p) => p !== path) : [...prefs.hidden, path];
    edit({ ...prefs, hidden });
  }

  async function save(next: MenuPreferences = prefs) {
    if (!tenant) return;
    setSaving(true);
    setError(null);
    try {
      await updateTenant(tenant.id, { settings: { menu: next } });
      await mutate("/api/tenants");
      setDraft(null);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el menú.");
    } finally {
      setSaving(false);
    }
  }

  return {
    prefs,
    dirty: draft !== null,
    saving,
    error,
    done,
    move,
    moveGroup,
    toggleGroup,
    toggle,
    discard: () => setDraft(null),
    save: () => save(),
    restore: () => save(EMPTY),
  };
}

export type MenuEditorController = ReturnType<typeof useMenuEditor>;
