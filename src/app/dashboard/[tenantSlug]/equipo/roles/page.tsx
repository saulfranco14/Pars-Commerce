"use client";

import { useState } from "react";
import { Check, Loader2, Plus, RotateCcw, Trash2, Undo2 } from "lucide-react";

import { useRoleEditor } from "@/features/equipo/hooks/useRoleEditor";
import { useActiveTenant } from "@/stores/useTenantStore";
import { PageHeader } from "@/components/admin/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui/buttonClasses";
import { NewRoleSheet } from "@/features/equipo/components/roles/NewRoleSheet";
import { RoleList } from "@/features/equipo/components/roles/RoleList";
import { RolePermissionToggles } from "@/features/equipo/components/roles/RolePermissionToggles";
import { RolePreviewPanel } from "@/features/equipo/components/roles/RolePreviewPanel";

import { roleLabel } from "@/features/equipo/constants/roleDescriptions";
import { SYSTEM_ROLE_PERMISSIONS } from "@/constants/systemRoles";

export default function RolesPage() {
  const activeTenant = useActiveTenant();
  const editor = useRoleEditor(activeTenant?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<"reset" | "delete" | null>(null);

  const role = editor.selected;
  const isOwner = role?.name === "owner";
  const canReset = Boolean(role?.is_system && SYSTEM_ROLE_PERMISSIONS[role.name]);
  const canDelete = Boolean(role && !role.is_system);
  const members = role ? editor.membersOf(role.id) : 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Roles y permisos"
        description="Elige un rol, prende lo que puede hacer y mira al lado qué verá."
        action={
          <button type="button" onClick={() => setCreating(true)} className={btnPrimary}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo rol
          </button>
        }
      />

      {editor.error && <Notification tone="error" message={editor.error} />}
      {editor.saved && !editor.dirty && <Notification tone="success" message="Rol guardado. Aplica en cuanto la persona recargue." />}

      {editor.loading || !role ? (
        <LoadingBlock variant="skeleton" message="Cargando roles" skeletonRows={4} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)_15rem] xl:grid-cols-[17rem_minmax(0,1fr)_16rem]">
          <RoleList editor={editor} />

          <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="role-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="role-title" className="text-lg font-bold text-foreground">
                {roleLabel(role.name)}
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {members === 1 ? "1 persona" : `${members} personas`}
                </span>
              </h2>
              {isOwner && <span className="text-sm text-muted-foreground">Acceso total; no se edita.</span>}
            </div>

            <RolePermissionToggles editor={editor} />

            {!isOwner && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border-soft pt-4">
                <button type="button" onClick={() => editor.save()} disabled={!editor.dirty || editor.saving} className={btnPrimary}>
                  {editor.saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                  Guardar cambios
                </button>
                {editor.dirty && (
                  <button type="button" onClick={editor.discard} className={btnSecondary}>
                    <Undo2 className="h-4 w-4" aria-hidden />
                    Descartar
                  </button>
                )}
                {canReset && (
                  <button type="button" onClick={() => setConfirm("reset")} className={btnSecondary}>
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Restablecer
                  </button>
                )}
                {canDelete && (
                  <button type="button" onClick={() => setConfirm("delete")} className={`${btnDanger} ml-auto`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Borrar rol
                  </button>
                )}
              </div>
            )}
          </section>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <RolePreviewPanel editor={editor} />
          </div>
        </div>
      )}

      <NewRoleSheet isOpen={creating} roles={editor.roles} onClose={() => setCreating(false)} onCreate={editor.create} />
      <ConfirmDialog
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm === "reset") await editor.reset();
          if (confirm === "delete") await editor.remove();
          setConfirm(null);
        }}
        loading={editor.saving}
        variant={confirm === "delete" ? "danger" : "default"}
        title={confirm === "delete" ? `¿Borrar el rol ${role ? roleLabel(role.name) : ""}?` : "¿Restablecer los permisos de Tlaco?"}
        description={
          confirm === "delete"
            ? "Solo se puede si nadie lo tiene asignado."
            : "Vuelve a los permisos con los que viene este rol. Afecta a todas las personas que lo tienen."
        }
        confirmLabel={confirm === "delete" ? "Borrar" : "Restablecer"}
      />
    </div>
  );
}
