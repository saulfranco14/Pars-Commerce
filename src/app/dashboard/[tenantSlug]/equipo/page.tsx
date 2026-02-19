"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
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
import { updateRole, remove as removeMember } from "@/services/teamService";
import { swrFetcher } from "@/lib/swrFetcher";
import { btnPrimaryHeader, btnDanger } from "@/components/ui/buttonClasses";

const teamKey = (tenantId: string) =>
  `/api/team?tenant_id=${encodeURIComponent(tenantId)}`;
const tenantRolesKey = (tenantId: string) =>
  `/api/tenant-roles?tenant_id=${encodeURIComponent(tenantId)}`;

export default function EquipoPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const teamKeyValue = activeTenant ? teamKey(activeTenant.id) : null;
  const rolesKeyValue = activeTenant ? tenantRolesKey(activeTenant.id) : null;

  const {
    data: membersData,
    error: teamError,
    isLoading: loading,
    mutate: mutateTeam,
  } = useSWR<TeamMember[]>(teamKeyValue, swrFetcher, { fallbackData: [] });

  const { data: rolesData } = useSWR<TenantRoleOption[]>(
    rolesKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );

  const members = Array.isArray(membersData) ? membersData : [];
  const roles = Array.isArray(rolesData) ? rolesData : [];

  const displayError = error ?? (teamError ? "No se pudo cargar el equipo" : null);

  async function handleRoleChange(membershipId: string, roleId: string) {
    setUpdatingId(membershipId);
    setError(null);
    try {
      await updateRole(membershipId, roleId);
      await mutateTeam();
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
      await mutateTeam();
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
          className={btnPrimaryHeader}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Agregar miembro
        </Link>
      </div>

      {displayError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
          {displayError}
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
                      className={btnDanger}
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
                            className={btnDanger}
                            aria-label={`Quitar a ${m.display_name || m.email}`}
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
