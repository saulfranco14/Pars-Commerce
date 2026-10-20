"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { KeyRound, PauseCircle, PlayCircle, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { useMemberPasswordChange } from "@/features/equipo/hooks/useMemberPasswordChange";
import { useActiveTenant } from "@/stores/useTenantStore";
import type { TeamMember } from "@/types/team";
import type { TenantRoleOption } from "@/services/tenantRolesService";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { FAB } from "@/components/ui/FAB";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableHeaderCellRightClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
} from "@/components/ui/TableWrapper";
import { setMemberStatus, updateRole, remove as removeMember } from "@/services/teamService";
import { swrFetcher } from "@/lib/swrFetcher";
import { isAbortError } from "@/services/apiFetch";
import { btnDanger, btnSecondary } from "@/components/ui/buttonClasses";
import { teamKey, tenantRolesKey } from "@/features/equipo/helpers/swrKeys";
import { TeamMemberFormSheet } from "@/features/equipo/components/TeamMemberFormSheet";
import { MemberRoleSelect } from "@/features/equipo/components/MemberRoleSelect";
import { MemberPasswordSheet } from "@/features/equipo/components/MemberPasswordSheet";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";
import { staffUsernameOf } from "@/lib/auth/staffLogin";

export default function EquipoPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const passwordSheet = useMemberPasswordChange();

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") setCreateOpen(true);
  }, [searchParams]);

  function closeCreate() {
    setCreateOpen(false);
    if (searchParams.get("nuevo") === "1") {
      router.replace(`/dashboard/${tenantSlug}/equipo`);
    }
  }

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

  const displayError =
    error ??
    (teamError && !isAbortError(teamError) ? "No se pudo cargar el equipo" : null);

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

  async function handleRemove() {
    if (!removing) return;
    setUpdatingId(removing.id);
    setError(null);
    try {
      await removeMember(removing.id);
      await mutateTeam();
      setRemoving(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setRemoving(null);
    } finally {
      setUpdatingId(null);
    }
  }

  const loginOf = (m: TeamMember) => staffUsernameOf(m.email) ?? m.email ?? "—";

  async function handleStatus(member: TeamMember) {
    const action = member.status === "suspended" ? "reactivate" : "suspend";
    const reason = action === "suspend" ? prompt("Indica el motivo de la suspensión:") : undefined;
    if (action === "suspend" && !reason?.trim()) return;
    setUpdatingId(member.id);
    try {
      await setMemberStatus(member.id, action, reason ?? undefined);
      await mutateTeam();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el acceso");
    } finally {
      setUpdatingId(null);
    }
  }

  const statusLabel = (status: TeamMember["status"]) => status === "active" ? "Activa" : status === "invited" ? "Invitada" : "Suspendida";
  const statusTone = (status: TeamMember["status"]) => status === "active" ? "bg-emerald-50 text-emerald-700" : status === "invited" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

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
      <PageHeader
        title="Equipo"
        description={`${members.length} ${members.length === 1 ? "persona tiene" : "personas tienen"} acceso. Puedes agregar a todas las que tu negocio necesite.`}
        action={
          <Link href={`/dashboard/${tenantSlug}/equipo/roles`} className={btnSecondary}>
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Roles y permisos
          </Link>
        }
      />

      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4 shrink-0 text-accent" aria-hidden />
        El equipo no tiene un límite de personas; controla el acceso con roles.
      </div>

      {/* Único punto de creación — FAB en móvil y desktop. */}
      <FAB
        onClick={() => setCreateOpen(true)}
        aria-label="Agregar miembro"
        alwaysVisible
      >
        <Plus className="h-6 w-6 shrink-0" aria-hidden />
      </FAB>

      {displayError && <Notification tone="error" message={displayError} />}

      {loading ? (
        <LoadingBlock
          variant="skeleton"
          message="Cargando equipo"
          skeletonRows={4}
        />
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
          <p className="text-sm text-muted">
            Aún no hay miembros adicionales. Puedes agregar a todas las personas que necesites.
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
                  {loginOf(m)}
                </p>
                <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(m.status)}`}>{statusLabel(m.status)}</span>
                <div className="mt-4 flex flex-wrap items-start gap-3 border-t border-border-soft pt-4">
                  <MemberRoleSelect
                    roles={roles}
                    value={m.role_id}
                    onChange={(roleId) => handleRoleChange(m.id, roleId)}
                    disabled={updatingId === m.id || m.role_name === "owner"}
                    ariaLabel={`Rol de ${m.display_name || m.email}`}
                    className="flex-1"
                  />
                  {m.role_name !== "owner" && <div className="flex min-h-11 flex-1 gap-2">
                    <button type="button" onClick={() => handleStatus(m)} disabled={updatingId === m.id || m.status === "invited"} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-semibold disabled:opacity-50">
                      {m.status === "suspended" ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}{m.status === "suspended" ? "Reactivar" : "Suspender"}
                    </button>
                    <button type="button" onClick={() => setRemoving(m)} disabled={updatingId === m.id} className={btnDanger}><Trash2 className="h-4 w-4" aria-hidden />Quitar</button>
                  </div>}
                  {m.can_set_password && (
                    <button type="button" onClick={() => passwordSheet.open(m)} disabled={updatingId === m.id} className="inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-semibold disabled:opacity-50">
                      <KeyRound className="h-4 w-4" aria-hidden />Cambiar contraseña
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
                    <th className={tableHeaderCellClass}>Email o usuario</th>
                    <th className={tableHeaderCellClass}>Rol</th>
                    <th className={tableHeaderCellClass}>Estado</th>
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
                        {loginOf(m)}
                      </td>
                      <td className={tableBodyCellClass}>
                        <MemberRoleSelect
                          roles={roles}
                          value={m.role_id}
                          onChange={(roleId) => handleRoleChange(m.id, roleId)}
                          disabled={
                            updatingId === m.id || m.role_name === "owner"
                          }
                          ariaLabel={`Rol de ${m.display_name || m.email}`}
                          className="max-w-xs"
                        />
                      </td>
                      <td className={tableBodyCellClass}><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(m.status)}`}>{statusLabel(m.status)}</span></td>
                      <td className="px-4 py-3 text-right">
                        {m.role_name !== "owner" && <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => handleStatus(m)} disabled={updatingId === m.id || m.status === "invited"} className="min-h-11 rounded-lg border border-border px-3 text-sm font-semibold disabled:opacity-50">{m.status === "suspended" ? "Reactivar" : "Suspender"}</button>
                          {m.can_set_password && <button type="button" onClick={() => passwordSheet.open(m)} disabled={updatingId === m.id} aria-label={`Cambiar contraseña de ${m.display_name || loginOf(m)}`} title="Cambiar contraseña" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold disabled:opacity-50"><KeyRound className="h-4 w-4" aria-hidden /></button>}
                          <button type="button" onClick={() => setRemoving(m)} disabled={updatingId === m.id} className={btnDanger}>{updatingId === m.id ? "..." : "Quitar"}</button>
                        </div>}
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

      <TeamMemberFormSheet
        isOpen={createOpen}
        tenantId={activeTenant.id}
        onClose={closeCreate}
        onAdded={() => void mutateTeam()}
      />
      <MemberPasswordSheet sheet={passwordSheet} />
      <ConfirmDialog
        isOpen={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        loading={Boolean(removing) && updatingId === removing?.id}
        variant="danger"
        title={`¿Quitar a ${removing?.display_name || "esta persona"} del equipo?`}
        description="Dejará de ver este negocio. Su cuenta no se borra."
        confirmLabel="Quitar"
      />
    </div>
  );
}
