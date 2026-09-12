"use client";

import { useDeferredValue, useState } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  Building2,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
} from "lucide-react";

import { EmptyState } from "@/components/admin/EmptyState";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormSheet } from "@/components/ui/FormSheet";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Toast, type ToastTone } from "@/components/ui/Toast";
import { swrFetcher } from "@/lib/swrFetcher";
import type {
  PlatformAccountStatus,
  PlatformUser,
  PlatformUsersResponse,
} from "@/features/platform/types";
import { PlatformPagination } from "./PlatformPagination";

type Filter = "all" | PlatformAccountStatus;
type AccountAction = "suspend" | "reactivate" | "verify";

const STATUS_META = {
  active: { label: "Activo", tone: "success" as const },
  pending: { label: "Pendiente", tone: "warning" as const },
  suspended: { label: "Suspendido", tone: "danger" as const },
};

function formatDate(value: string | null): string {
  if (!value) return "Sin registro";
  return new Date(value).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error ?? fallback;
}

export function PlatformUsersView() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [action, setAction] = useState<{ type: AccountAction; user: PlatformUser } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const key = `/api/platform/users?page=${page}&per_page=10&status=${filter}&q=${encodeURIComponent(deferredSearch)}`;
  const { data, error, isLoading, mutate } = useSWR<PlatformUsersResponse>(key, swrFetcher, {
    keepPreviousData: true,
  });

  function changeFilter(next: Filter) {
    setFilter(next);
    setPage(1);
  }

  function beginAction(type: AccountAction, user: PlatformUser) {
    setSelectedUser(null);
    setReason("");
    setAction({ type, user });
  }

  async function executeAction() {
    if (!action || (action.type === "suspend" && !reason.trim())) return;
    setBusy(true);
    const status =
      action.type === "suspend"
        ? "suspended"
        : action.type === "verify"
          ? "verified"
          : "active";
    const response = await fetch(`/api/platform/users/${action.user.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason: reason.trim() || undefined }),
    });

    if (!response.ok) {
      setToast({
        message: await readApiError(response, "No se pudo actualizar la cuenta."),
        tone: "error",
      });
      if (action.type !== "suspend") setAction(null);
      setBusy(false);
      return;
    }

    await mutate();
    const successMessage =
      action.type === "suspend"
        ? "Cuenta suspendida."
        : action.type === "verify"
          ? "Validación interna aprobada."
          : "Cuenta reactivada.";
    setAction(null);
    setReason("");
    setBusy(false);
    setToast({ message: successMessage, tone: "success" });
  }

  if (isLoading && !data) {
    return <LoadingBlock message="Cargando usuarios…" variant="skeleton" />;
  }
  if (error && !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar los usuarios"
        description="Intenta actualizar la página."
        tone="muted"
      />
    );
  }

  const stats = data?.stats ?? { total: 0, active: 0, pending: 0, suspended: 0 };
  const users = data?.users ?? [];

  return (
    <>
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumen de usuarios">
        <FilterCard label="Todos" value={stats.total} active={filter === "all"} onClick={() => changeFilter("all")} />
        <FilterCard label="Activos" value={stats.active} active={filter === "active"} onClick={() => changeFilter("active")} tone="success" />
        <FilterCard label="Pendientes" value={stats.pending} active={filter === "pending"} onClick={() => changeFilter("pending")} tone="warning" />
        <FilterCard label="Suspendidos" value={stats.suspended} active={filter === "suspended"} onClick={() => changeFilter("suspended")} tone="danger" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border-soft p-3 sm:p-4">
          <label className="relative block">
            <span className="sr-only">Buscar usuarios</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, correo o teléfono"
              className="input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>

        {users.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={UserRound}
              title="Sin resultados"
              description="Prueba otra búsqueda o cambia el filtro de estado."
              tone="muted"
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-border-soft md:hidden">
              {users.map((user) => (
                <UserMobileCard key={user.id} user={user} onOpen={() => setSelectedUser(user)} />
              ))}
            </div>
            <div className="hidden md:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-border-soft bg-surface-raised text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-[34%] px-5 py-3">Usuario</th>
                    <th className="w-[18%] px-4 py-3">Estado</th>
                    <th className="w-[16%] px-4 py-3">Negocios</th>
                    <th className="w-[18%] px-4 py-3">Último acceso</th>
                    <th className="w-[14%] px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {users.map((user) => {
                    const meta = STATUS_META[user.status];
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-surface-raised/70">
                        <td className="px-5 py-3">
                          <p className="truncate font-bold text-foreground">{user.display_name || user.email}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </td>
                        <td className="px-4 py-3"><StatusBadge tone={meta.tone} label={meta.label} /></td>
                        <td className="px-4 py-3 text-muted-foreground"><span className="font-semibold tabular-nums text-foreground">{user.active_businesses}</span> activos</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(user.last_sign_in_at)}</td>
                        <td className="px-5 py-3 text-right">
                          <button type="button" onClick={() => setSelectedUser(user)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                            Ver ficha
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data && (
          <PlatformPagination page={data.page} totalPages={data.total_pages} total={data.total} itemLabel="usuarios encontrados" onChange={setPage} />
        )}
      </section>

      <UserDetailSheet
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onAction={beginAction}
      />

      <FormSheet
        isOpen={action?.type === "suspend"}
        onClose={() => !busy && setAction(null)}
        dismissible={!busy}
        title="Suspender cuenta"
        description={action ? `${action.user.display_name || action.user.email} perderá acceso a Tlaco.` : undefined}
        icon={UserX}
        footer={
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setAction(null)} disabled={busy} className="min-h-12 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={() => void executeAction()} disabled={busy || !reason.trim()} className="min-h-12 rounded-xl bg-red-600 px-4 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Suspendiendo…" : "Suspender cuenta"}
            </button>
          </div>
        }
      >
        <label className="block text-sm font-semibold text-foreground" htmlFor="suspension-reason">
          Motivo de la suspensión
        </label>
        <textarea
          id="suspension-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          autoFocus
          placeholder="Explica por qué se suspende esta cuenta"
          className="input-form mt-2 w-full resize-none rounded-xl border border-border bg-surface-raised px-3 py-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <p className="mt-2 text-xs text-muted-foreground">El motivo quedará registrado en Auditoría.</p>
      </FormSheet>

      <ConfirmDialog
        isOpen={action?.type === "reactivate"}
        onClose={() => setAction(null)}
        onConfirm={executeAction}
        loading={busy}
        title="Reactivar cuenta"
        description="La persona podrá volver a iniciar sesión y acceder a sus negocios."
        confirmLabel="Reactivar"
        icon={UserCheck}
      />
      <ConfirmDialog
        isOpen={action?.type === "verify"}
        onClose={() => setAction(null)}
        onConfirm={executeAction}
        loading={busy}
        title="Activar cuenta manualmente"
        description="Aprueba la validación interna de esta cuenta. La persona ya puede usar Tlaco mientras la revisión está pendiente."
        confirmLabel="Aprobar validación"
        icon={ShieldCheck}
      />

      {toast && <Toast message={toast.message} tone={toast.tone} onDone={() => setToast(null)} />}
    </>
  );
}

function FilterCard({ label, value, active, onClick, tone = "default" }: { label: string; value: number; active: boolean; onClick: () => void; tone?: "default" | "success" | "warning" | "danger" }) {
  const valueColor = tone === "success" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : tone === "danger" ? "text-red-600" : "text-foreground";
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-20 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${active ? "border-accent bg-accent/5" : "border-border bg-surface hover:bg-surface-raised"}`}>
      <span className="block text-xs font-medium text-muted-foreground">{label}</span>
      <span className={`mt-1 block text-xl font-bold tabular-nums ${valueColor}`}>{value}</span>
    </button>
  );
}

function UserMobileCard({ user, onOpen }: { user: PlatformUser; onOpen: () => void }) {
  const meta = STATUS_META[user.status];
  return (
    <article className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{user.display_name || user.email}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <StatusBadge tone={meta.tone} label={meta.label} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <p><span className="font-semibold text-foreground">{user.active_businesses}</span> negocios activos</p>
        <p className="text-right">Acceso: {formatDate(user.last_sign_in_at)}</p>
      </div>
      <button type="button" onClick={onOpen} className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground">Ver ficha y acciones</button>
    </article>
  );
}

function UserDetailSheet({ user, onClose, onAction }: { user: PlatformUser | null; onClose: () => void; onAction: (type: AccountAction, user: PlatformUser) => void }) {
  const meta = user ? STATUS_META[user.status] : STATUS_META.active;
  return (
    <FormSheet
      isOpen={Boolean(user)}
      onClose={onClose}
      title={user?.display_name || user?.email || "Usuario"}
      description={user?.email}
      icon={UserRound}
      maxWidth="max-w-2xl"
      footer={user ? (
        <div className="grid gap-2 sm:flex sm:justify-end">
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground">Cerrar</button>
          {user.status === "pending" && (
            <button type="button" onClick={() => onAction("verify", user)} className="min-h-12 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground">Aprobar validación</button>
          )}
          {user.status === "suspended" && <button type="button" onClick={() => onAction("reactivate", user)} className="min-h-12 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground">Reactivar cuenta</button>}
          {user.status === "active" && !user.is_self && <button type="button" onClick={() => onAction("suspend", user)} className="min-h-12 rounded-xl bg-red-600 px-4 text-sm font-bold text-white">Suspender cuenta</button>}
        </div>
      ) : null}
    >
      {user && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={meta.tone} label={meta.label} />
            {user.is_platform_admin && <StatusBadge tone="info" label="Super admin" />}
            {user.is_self && <span className="text-xs font-semibold text-muted-foreground">Tu cuenta</span>}
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-raised p-4 text-sm">
            <Detail label="Teléfono" value={user.phone || "No registrado"} />
            <Detail label="Alta" value={formatDate(user.created_at)} />
            <Detail label="Validación interna" value={user.status === "pending" ? "Pendiente de revisión" : "Aprobada"} />
            <Detail label="Último acceso" value={formatDate(user.last_sign_in_at)} />
          </dl>
          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><Building2 className="h-4 w-4 text-accent" aria-hidden />Negocios vinculados</h3>
              <span className="text-xs text-muted-foreground">{user.memberships.length}</span>
            </div>
            {user.memberships.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">Esta cuenta todavía no pertenece a ningún negocio.</p>
            ) : (
              <div className="divide-y divide-border-soft rounded-xl border border-border">
                {user.memberships.map((membership) => (
                  <div key={membership.tenant_id} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                    <div className="min-w-0"><p className="truncate font-semibold text-foreground">{membership.tenant?.name ?? "Negocio sin nombre"}</p><p className="truncate text-xs text-muted-foreground">/{membership.tenant?.slug ?? membership.tenant_id}</p></div>
                    <div className="text-right"><p className="font-semibold capitalize text-foreground">{membership.role}</p><p className="text-xs capitalize text-muted-foreground">{membership.status}</p></div>
                  </div>
                ))}
              </div>
            )}
          </section>
          {user.is_self && <p className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground">Para proteger el acceso a la plataforma, no puedes suspender tu propia cuenta.</p>}
        </div>
      )}
    </FormSheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-0.5 font-semibold text-foreground">{value}</dd></div>;
}
