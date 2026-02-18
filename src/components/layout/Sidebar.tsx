"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { X, Download } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

interface SidebarProps {
  tenantSlug: string | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onSignOut?: () => void;
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
          ? "bg-border-soft text-foreground"
          : "text-muted hover:bg-border-soft/60 hover:text-foreground active:bg-border-soft"
      }`}
    >
      {children}
    </Link>
  );
}

interface SidebarContentProps {
  pathname: string;
  slug: string | null;
  base: string;
  hasTenant: boolean;
  memberships: {
    id: string;
    tenant_id: string;
    tenant: { name: string };
    role?: { name: string };
  }[];
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  profile: { display_name: string | null; email: string | null } | null;
  onNavigate?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  onSignOut?: () => void;
  isPwaInstallable?: boolean;
  onPwaInstall?: () => void;
}

function SidebarContent(props: SidebarContentProps) {
  const {
    pathname,
    base,
    hasTenant,
    memberships,
    activeTenantId,
    setActiveTenantId,
    profile,
    onNavigate,
    showCloseButton,
    onClose,
    onSignOut,
    isPwaInstallable,
    onPwaInstall,
  } = props;
  const activeMembership = memberships.find(
    (m) => m.tenant_id === activeTenantId,
  );
  const userRole = activeMembership?.role?.name || "member";
  const canAccessTeamAndSettings = userRole !== "member";
  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-soft px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <Image
            src="/android-chrome-192x192.png"
            alt="Pars Commerce"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-lg"
          />
          <span>Pars Commerce</span>
        </Link>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-border-soft hover:text-foreground"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      {memberships.length > 0 && (
        <div className="shrink-0 border-b border-border-soft px-3 py-3">
          <select
            value={activeTenantId ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              setActiveTenantId(id);
              if (typeof window !== "undefined") {
                localStorage.setItem("pars_activeTenantId", id ?? "");
              }
            }}
            className="select-custom w-full min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-h-0 sm:py-1.5"
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
            {canAccessTeamAndSettings && (
              <NavLink
                href={`${base}/ventas`}
                active={
                  pathname === `${base}/ventas` ||
                  pathname.startsWith(`${base}/ventas/`)
                }
                onNavigate={onNavigate}
              >
                Ventas y Comisiones
              </NavLink>
            )}
            {canAccessTeamAndSettings && (
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
            )}
            {canAccessTeamAndSettings && (
              <>
                <NavLink
                  href={`${base}/sitio-web`}
                  active={pathname === `${base}/sitio-web`}
                  onNavigate={onNavigate}
                >
                  Sitio web
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
          </>
        )}
      </nav>
      <div
        className="shrink-0 space-y-2 border-t border-border-soft p-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {isPwaInstallable && onPwaInstall && (
          <button
            type="button"
            onClick={onPwaInstall}
            className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            <Download className="h-5 w-5" />
            Instalar app
          </button>
        )}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full min-h-[44px] rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
          >
            Cerrar sesión
          </button>
        )}
        <Link
          href="/dashboard/perfil"
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-border-soft/60"
        >
          <p className="font-medium">{profile?.display_name || "Usuario"}</p>
          {profile?.email && (
            <p className="truncate text-xs text-muted">{profile.email}</p>
          )}
        </Link>
      </div>
    </>
  );
}

export function Sidebar({
  tenantSlug,
  mobileOpen = false,
  onMobileClose,
  onSignOut,
}: SidebarProps) {
  const pathname = usePathname();
  const profile = useSessionStore((s) => s.profile);
  const memberships = useTenantStore((s) => s.memberships);
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const { isInstallable, install } = usePwaInstall();

  const slug = tenantSlug ?? activeTenant?.slug ?? null;
  const base = slug ? `/dashboard/${slug}` : "/dashboard";
  const hasTenant = !!slug;

  const sidebarContentProps = {
    pathname,
    slug,
    base,
    hasTenant,
    memberships,
    activeTenantId,
    setActiveTenantId,
    profile,
    onSignOut,
    isPwaInstallable: isInstallable,
    onPwaInstall: install,
  };

  return (
    <>
      <aside className="hidden h-screen max-h-screen w-56 shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-border-soft bg-surface md:flex">
        <SidebarContent
          {...sidebarContentProps}
        />
      </aside>
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
            aria-hidden
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex h-screen max-h-screen w-72 max-w-[85vw] flex-col overflow-y-auto overflow-x-hidden border-r border-border-soft bg-surface shadow-xl md:hidden">
            <SidebarContent
              {...sidebarContentProps}
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
