"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { X } from "lucide-react";

interface SidebarProps {
  tenantSlug: string | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavLink({
  href,
  children,
  active,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block min-h-[44px] rounded-lg px-3 py-3 text-base font-medium transition-colors sm:min-h-0 sm:py-2 sm:text-sm ${
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100"
      }`}
    >
      {children}
    </Link>
  );
}

function SidebarContent({
  pathname,
  slug,
  base,
  hasTenant,
  memberships,
  activeTenantId,
  setActiveTenantId,
  profile,
  onNavigate,
  showCloseButton,
  onClose,
}: {
  pathname: string;
  slug: string | null;
  base: string;
  hasTenant: boolean;
  memberships: { id: string; tenant_id: string; tenant: { name: string } }[];
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  profile: { display_name: string | null; email: string | null } | null;
  onNavigate?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="font-semibold text-zinc-900"
        >
          Pars Commerce
        </Link>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {memberships.length > 0 && (
        <div className="border-b border-zinc-100 px-3 py-3">
          <select
            value={activeTenantId ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              setActiveTenantId(id);
              if (typeof window !== "undefined") {
                localStorage.setItem("pars_activeTenantId", id ?? "");
              }
            }}
            className="w-full min-h-[44px] rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-1 sm:min-h-0 sm:py-1.5"
          >
            <option value="">Seleccionar negocio</option>
            {memberships.map((m) => (
              <option key={m.id} value={m.tenant_id}>
                {m.tenant.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <nav className="flex min-h-0 flex-1 flex-col space-y-0.5 overflow-auto p-3">
        <NavLink
          href="/dashboard"
          active={pathname === "/dashboard"}
          onNavigate={onNavigate}
        >
          Inicio
        </NavLink>
        {hasTenant && (
          <>
            <NavLink
              href={`${base}/productos`}
              active={
                pathname === `${base}/productos` ||
                pathname.startsWith(`${base}/productos/`)
              }
              onNavigate={onNavigate}
            >
              Productos
            </NavLink>
            <NavLink
              href={`${base}/servicios`}
              active={
                pathname === `${base}/servicios` ||
                pathname.startsWith(`${base}/servicios/`)
              }
              onNavigate={onNavigate}
            >
              Servicios
            </NavLink>
            <NavLink
              href={`${base}/ordenes`}
              active={
                pathname === `${base}/ordenes` ||
                pathname.startsWith(`${base}/ordenes/`)
              }
              onNavigate={onNavigate}
            >
              Órdenes / Tickets
            </NavLink>
            <NavLink
              href={`${base}/equipo`}
              active={
                pathname === `${base}/equipo` ||
                pathname.startsWith(`${base}/equipo/`)
              }
              onNavigate={onNavigate}
            >
              Equipo
            </NavLink>
            <NavLink
              href={`${base}/configuracion`}
              active={pathname === `${base}/configuracion`}
              onNavigate={onNavigate}
            >
              Configuración
            </NavLink>
          </>
        )}
      </nav>
      <div className="border-t border-zinc-200 p-3">
        <Link
          href="/dashboard/perfil"
          onClick={onNavigate}
          className="block min-h-[44px] rounded-lg px-3 py-3 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100 sm:min-h-0 sm:py-2"
        >
          {profile?.display_name || profile?.email || "Mi perfil"}
        </Link>
      </div>
    </>
  );
}

export function Sidebar({
  tenantSlug,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const profile = useSessionStore((s) => s.profile);
  const memberships = useTenantStore((s) => s.memberships);
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const slug = tenantSlug ?? activeTenant?.slug ?? null;
  const base = slug ? `/dashboard/${slug}` : "/dashboard";
  const hasTenant = !!slug;

  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        <SidebarContent
          pathname={pathname}
          slug={slug}
          base={base}
          hasTenant={hasTenant}
          memberships={memberships}
          activeTenantId={activeTenantId}
          setActiveTenantId={setActiveTenantId}
          profile={profile}
        />
      </aside>
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-zinc-200 bg-white shadow-xl md:hidden">
            <SidebarContent
              pathname={pathname}
              slug={slug}
              base={base}
              hasTenant={hasTenant}
              memberships={memberships}
              activeTenantId={activeTenantId}
              setActiveTenantId={setActiveTenantId}
              profile={profile}
              onNavigate={onMobileClose}
              showCloseButton
              onClose={onMobileClose}
            />
          </aside>
        </>
      )}
    </>
  );
}
