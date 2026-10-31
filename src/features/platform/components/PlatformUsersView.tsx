"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Building2,
  Download,
  MessageCircle,
  Plus,
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
import { buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { ACTIVATION_NUDGE, ORIGIN_LABEL, USER_ACTIVATION_META, USER_QUICK_VIEWS } from "@/features/platform/constants/userActivation";
import type {
  PlatformAccountStatus,
  PlatformUser,
  PlatformUsersResponse,
  UserFilters,
  UserSort,
} from "@/features/platform/types";
import { PlatformPagination } from "./PlatformPagination";

const selectClass = "input-form min-h-11 rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function usersQuery(params: { page: number; status: Filter; q: string; filters: UserFilters; sort: UserSort; desc: boolean }): string {
  const query = new URLSearchParams({ page: String(params.page), per_page: "25", sort: params.sort, dir: params.desc ? "desc" : "asc" });
  if (params.status !== "all") query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  for (const [key, value] of Object.entries(params.filters)) if (value !== undefined && value !== "") query.set(key, String(value));
  return query.toString();
}

/** Owner's WhatsApp with the message that moves their business to the next stage. */
function nudgeLink(user: PlatformUser): string | null {
  const nudge = ACTIVATION_NUDGE[user.activation];
  if (!nudge || !user.phone) return null;
  const digits = user.phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return buildWaLink(`+52${digits.slice(-10)}`, `Hola${user.display_name ? ` ${user.display_name.split(" ")[0]}` : ""}, le escribo de Tlaco. ${nudge}`);
}

function createBusinessHref(user: PlatformUser): string {
  const query = new URLSearchParams({ owner_email: user.email, owner_name: user.display_name ?? "", owner_phone: user.phone ?? "" });
  return `/dashboard/plataforma/negocios/nuevo?${query.toString()}`;
}

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
  const [filters, setFilters] = useState<UserFilters>({});
  const [quick, setQuick] = useState<string | null>(null);
  const [sort, setSort] = useState<UserSort>("created_at");
  const [desc, setDesc] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [action, setAction] = useState<{ type: AccountAction; user: PlatformUser } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null);

  const query = usersQuery({ page, status: filter, q: deferredSearch, filters, sort, desc });
  const key = `/api/platform/users?${query}`;
  const { data, error, isLoading, mutate } = useSWR<PlatformUsersResponse>(key, swrFetcher, {
    keepPreviousData: true,
  });

  function changeFilter(next: Filter) {
    setFilter(next);
    setPage(1);
  }

  function changeFilters(next: UserFilters, quickId: string | null = null) {
    setFilters(next);
    setQuick(quickId);
    setPage(1);
  }

  function sortBy(next: UserSort) {
    if (sort === next) setDesc((value) => !value);
    else {
      setSort(next);
      setDesc(next !== "name");
    }
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

  const stats = data?.stats ?? { total: 0, active: 0, pending: 0, suspended: 0, without_business: 0, without_mp: 0, from_engine: 0 };
  const users = data?.users ?? [];

  return (
    <>
      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Resumen de usuarios">
        <FilterCard label="Todos" value={stats.total} active={filter === "all"} onClick={() => changeFilter("all")} />
        <FilterCard label="Activos" value={stats.active} active={filter === "active"} onClick={() => changeFilter("active")} tone="success" />
        <FilterCard label="Pendientes" value={stats.pending} active={filter === "pending"} onClick={() => changeFilter("pending")} tone="warning" />
        <FilterCard label="Suspendidos" value={stats.suspended} active={filter === "suspended"} onClick={() => changeFilter("suspended")} tone="danger" />
      </section>

      <section className="flex flex-wrap gap-2" aria-label="Vistas rápidas">
        {USER_QUICK_VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            aria-pressed={quick === view.id}
            onClick={() => (quick === view.id ? changeFilters({}) : changeFilters(view.filters, view.id))}
            className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors ${quick === view.id ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-foreground hover:border-accent/50"}`}
          >
            {view.label}{view.stat ? <span className="ml-1.5 tabular-nums opacity-75">{stats[view.stat]}</span> : null}
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="grid gap-2 border-b border-border-soft p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_repeat(4,auto)_auto] lg:items-center">
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
              placeholder="Buscar por nombre, correo, teléfono o negocio"
              className="input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <select aria-label="Activación" value={filters.activation ?? ""} onChange={(event) => changeFilters({ ...filters, activation: (event.target.value || undefined) as UserFilters["activation"] })} className={selectClass}>
            <option value="">Activación: todas</option>
            {Object.entries(USER_ACTIVATION_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
            <option value="sin_mp">Con negocio, sin Mercado Pago</option>
          </select>
          <select aria-label="Mercado Pago" value={filters.mp ?? ""} onChange={(event) => changeFilters({ ...filters, mp: (event.target.value || undefined) as UserFilters["mp"] })} className={selectClass}>
            <option value="">Mercado Pago: todos</option>
            <option value="connected">Conectado</option>
            <option value="not">Sin conectar</option>
          </select>
          <select aria-label="Origen" value={filters.origin ?? ""} onChange={(event) => changeFilters({ ...filters, origin: (event.target.value || undefined) as UserFilters["origin"] })} className={selectClass}>
            <option value="">Origen: todos</option>
            {Object.entries(ORIGIN_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Último acceso" value={filters.idle_days ?? ""} onChange={(event) => changeFilters({ ...filters, idle_days: Number(event.target.value) || undefined })} className={selectClass}>
            <option value="">Último acceso: cualquiera</option>
            <option value="7">No entra hace 7 días</option>
            <option value="14">No entra hace 14 días</option>
            <option value="30">No entra hace 30 días</option>
          </select>
          <a href={`/api/platform/users?${query}&format=csv`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:bg-surface-raised">
            <Download className="h-4 w-4" aria-hidden />Exportar CSV
          </a>
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
                    <SortHeader value="name" label="Usuario" className="w-[26%] px-5 py-3" sort={sort} desc={desc} onSort={sortBy} />
                    <SortHeader value="activation" label="Negocio" className="w-[24%] px-4 py-3" sort={sort} desc={desc} onSort={sortBy} />
                    <th className="w-[12%] px-4 py-3">Mercado Pago</th>
                    <th className="w-[12%] px-4 py-3">Origen</th>
                    <SortHeader value="last_sign_in_at" label="Último acceso" className="w-[12%] px-4 py-3" sort={sort} desc={desc} onSort={sortBy} />
                    <th className="w-[14%] px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {users.map((user) => {
                    const meta = STATUS_META[user.status];
                    const activation = USER_ACTIVATION_META[user.activation];
                    const nudge = nudgeLink(user);
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-surface-raised/70">
                        <td className="px-5 py-3">
                          <p className="truncate font-bold text-foreground">{user.display_name || user.email}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          {user.status !== "active" ? <span className="mt-1 inline-block"><StatusBadge tone={meta.tone} label={meta.label} compact /></span> : null}
                        </td>
                        <td className="px-4 py-3">
                          <p className="truncate font-semibold text-foreground">{user.tenant?.name ?? "—"}</p>
                          <StatusBadge tone={activation.tone} label={activation.label} compact />
                        </td>
                        <td className="px-4 py-3">{user.tenant ? <StatusBadge tone={user.mp_connected ? "success" : "warning"} label={user.mp_connected ? "Conectado" : "Sin conectar"} compact dot={false} /> : <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{ORIGIN_LABEL[user.origin]}{user.acquired_by_name ? <span className="block truncate">· {user.acquired_by_name}</span> : null}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(user.last_sign_in_at)}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            {user.activation === "sin_negocio" ? (
                              <Link href={createBusinessHref(user)} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-accent hover:bg-accent/10"><Plus className="h-4 w-4" aria-hidden />Crear negocio</Link>
                            ) : nudge ? (
                              <a href={nudge} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-accent hover:bg-accent/10"><MessageCircle className="h-4 w-4" aria-hidden />WhatsApp</a>
                            ) : null}
                            <button type="button" onClick={() => setSelectedUser(user)} className="min-h-11 rounded-lg px-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                              Ver ficha
                            </button>
                          </div>
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

function SortHeader({ value, label, className, sort, desc, onSort }: { value: UserSort; label: string; className: string; sort: UserSort; desc: boolean; onSort: (value: UserSort) => void }) {
  const Arrow = desc ? ArrowDown : ArrowUp;
  return (
    <th className={className} aria-sort={sort === value ? (desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => onSort(value)} className="inline-flex min-h-8 items-center gap-1 uppercase tracking-wider hover:text-foreground">
        {label}{sort === value ? <Arrow className="h-3 w-3" aria-hidden /> : null}
      </button>
    </th>
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
  const activation = USER_ACTIVATION_META[user.activation];
  const nudge = nudgeLink(user);
  return (
    <article className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{user.display_name || user.email}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
        <StatusBadge tone={meta.tone} label={meta.label} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{user.tenant?.name ?? "Sin negocio"}</span>
        <StatusBadge tone={activation.tone} label={activation.label} compact />
        {user.tenant ? <StatusBadge tone={user.mp_connected ? "success" : "warning"} label={user.mp_connected ? "MP conectado" : "Sin MP"} compact dot={false} /> : null}
      </div>
      <p className="text-xs text-muted-foreground">{ORIGIN_LABEL[user.origin]}{user.acquired_by_name ? ` · ${user.acquired_by_name}` : ""} · Acceso: {formatDate(user.last_sign_in_at)}</p>
      <div className="grid grid-cols-2 gap-2">
        {user.activation === "sin_negocio" ? (
          <Link href={createBusinessHref(user)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent px-3 text-sm font-semibold text-accent">Crear negocio</Link>
        ) : nudge ? (
          <a href={nudge} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent px-3 text-sm font-semibold text-accent">WhatsApp</a>
        ) : <span />}
        <button type="button" onClick={onOpen} className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm font-semibold text-foreground">Ver ficha</button>
      </div>
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
