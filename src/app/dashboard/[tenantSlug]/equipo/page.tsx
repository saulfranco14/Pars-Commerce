"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useTenantStore } from "@/stores/useTenantStore";
import type { TeamMember } from "@/types/team";
import type { TenantRoleOption } from "@/services/tenantRolesService";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableHeaderCellRightClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
} from "@/components/ui/TableWrapper";
import { list as listTeam, updateRole, remove as removeMember } from "@/services/teamService";
import { list as listTenantRoles } from "@/services/tenantRolesService";

export default function EquipoPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<TenantRoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [roleUpdates, setRoleUpdates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!activeTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      listTeam(activeTenant.id),
      listTenantRoles(activeTenant.id),
    ])
      .then(([membersList, rolesList]) => {
        setMembers(membersList);
        setRoles(rolesList);
      })
      .catch(() => setError("No se pudo cargar el equipo"))
      .finally(() => setLoading(false));
  }, [activeTenant?.id]);

  async function handleRoleChange(membershipId: string, roleId: string) {
    setUpdatingId(membershipId);
    setError(null);
    try {
      await updateRole(membershipId, roleId);
      setMembers((prev) =>
        prev.map((m) =>
          m.id === membershipId
            ? {
                ...m,
                role_id: roleId,
                role_name: roles.find((r) => r.id === roleId)?.name ?? "",
              }
            : m
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(membershipId: string) {
    if (!confirm("¿Quitar a este miembro del equipo?")) return;
    setUpdatingId(membershipId);
    setError(null);
    try {
      await removeMember(membershipId);
      setMembers((prev) => prev.filter((m) => m.id !== membershipId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Equipo
        </h1>
        <Link
          href={`/dashboard/${tenantSlug}/equipo/nuevo`}
          className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:min-h-0"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Agregar miembro
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingBlock
          variant="skeleton"
          message="Cargando equipo"
          skeletonRows={4}
        />
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
          <p className="text-sm text-muted">
            No hay miembros. Agrega uno con &quot;Agregar miembro&quot;.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4 md:hidden">
            {members.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-surface-raised p-4"
              >
                <p className="font-medium text-foreground">
                  {m.display_name || "—"}
                </p>
                <p className="mt-0.5 break-all text-sm text-muted">
                  {m.email || "—"}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border-soft pt-4">
                  <select
                    value={m.role_id}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    disabled={updatingId === m.id || m.role_name === "owner"}
                    className="input-form select-custom min-h-[44px] flex-1 rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                    aria-label={`Rol de ${m.display_name || m.email}`}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {m.role_name !== "owner" && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.id)}
                      disabled={updatingId === m.id}
                      className="min-h-[44px] rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 active:opacity-90"
                      aria-label={`Quitar a ${m.display_name || m.email}`}
                    >
                      {updatingId === m.id ? "..." : "Quitar"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block">
            <TableWrapper>
              <table className="min-w-full">
                <thead>
                  <tr className={tableHeaderRowClass}>
                    <th className={tableHeaderCellClass}>Nombre</th>
                    <th className={tableHeaderCellClass}>Email</th>
                    <th className={tableHeaderCellClass}>Rol</th>
                    <th className={tableHeaderCellRightClass}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className={tableBodyRowClass}>
                      <td className={tableBodyCellClass}>
                        {m.display_name || "—"}
                      </td>
                      <td className={tableBodyCellMutedClass}>
                        {m.email || "—"}
                      </td>
                      <td className={tableBodyCellClass}>
                        <select
                          value={m.role_id}
                          onChange={(e) =>
                            handleRoleChange(m.id, e.target.value)
                          }
                          disabled={
                            updatingId === m.id || m.role_name === "owner"
                          }
                          className="input-form select-custom min-h-[44px] rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.role_name !== "owner" && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m.id)}
                            disabled={updatingId === m.id}
                            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {updatingId === m.id ? "..." : "Quitar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
