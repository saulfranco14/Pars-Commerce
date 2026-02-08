"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore } from "@/stores/useTenantStore";

interface SidebarProps {
  tenantSlug: string | null;
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm font-medium ${
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ tenantSlug }: SidebarProps) {
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
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="font-semibold text-zinc-900">
          Pars Commerce
        </Link>
      </div>
      {memberships.length > 0 && (
        <div className="border-b border-zinc-100 px-3 py-2">
          <select
            value={activeTenantId ?? ""}
            onChange={(e) => {
              const id = e.target.value || null;
              setActiveTenantId(id);
              if (typeof window !== "undefined") {
                localStorage.setItem("pars_activeTenantId", id ?? "");
              }
            }}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
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
      <nav className="flex-1 space-y-0.5 p-3">
        <NavLink href="/dashboard" active={pathname === "/dashboard"}>
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
            >
              Productos
            </NavLink>
            <NavLink
              href={`${base}/servicios`}
              active={
                pathname === `${base}/servicios` ||
                pathname.startsWith(`${base}/servicios/`)
              }
            >
              Servicios
            </NavLink>
            <NavLink
              href={`${base}/ordenes`}
              active={
                pathname === `${base}/ordenes` ||
                pathname.startsWith(`${base}/ordenes/`)
              }
            >
              Órdenes / Tickets
            </NavLink>
            <NavLink
              href={`${base}/equipo`}
              active={
                pathname === `${base}/equipo` ||
                pathname.startsWith(`${base}/equipo/`)
              }
            >
              Equipo
            </NavLink>
            <NavLink
              href={`${base}/configuracion`}
              active={pathname === `${base}/configuracion`}
            >
              Configuración
            </NavLink>
          </>
        )}
      </nav>
      <div className="border-t border-zinc-200 p-3">
        <Link
          href="/dashboard/perfil"
          className="block rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
        >
          {profile?.display_name || profile?.email || "Mi perfil"}
        </Link>
      </div>
    </aside>
  );
}
