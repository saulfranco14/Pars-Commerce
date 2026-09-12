"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore, useActiveTenant } from "@/stores/useTenantStore";
import { useIsPlatformAdmin } from "@/features/settlement/hooks/useIsPlatformAdmin";
import {
  X,
  Download,
  Home,
  Package,
  Scissors,
  CalendarClock,
  ClipboardList,
  Banknote,
  Users,
  Repeat,
  BarChart3,
  UsersRound,
  Globe,
  Settings,
  QrCode,
  Table2,
  Landmark,
  ShieldCheck,
  Building2,
  ListChecks,
  Wallet,
  Sparkles,
  Plus,
} from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { FormSheet } from "@/components/ui/FormSheet";

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
  icon: Icon,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-border-soft text-foreground"
          : "text-muted hover:bg-border-soft/60 hover:text-foreground active:bg-border-soft"
      }`}
    >
      {Icon && (
        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-accent" : ""}`} />
      )}
      {children}
    </Link>
  );
}

interface SidebarContentProps {
  pathname: string;
  platformView: "operation" | "users" | "businesses" | "audit";
  slug: string | null;
  base: string;
  hasTenant: boolean;
  tenantsLoaded: boolean;
  memberships: {
    id: string;
    tenant_id: string;
    tenant: { name: string; slug: string; business_type?: string | null; is_demo?: boolean | null; theme_color?: string | null };
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
  const router = useRouter();
  const isPlatformAdmin = useIsPlatformAdmin();
  const [expansionOpen, setExpansionOpen] = useState(false);
  const [checkingExpansion, setCheckingExpansion] = useState(false);
  const [activatingOperation, setActivatingOperation] = useState(false);
  const [expansionError, setExpansionError] = useState<string | null>(null);
  const {
    pathname,
    platformView,
    base,
    hasTenant,
    tenantsLoaded,
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
  const canAccessTeamAndSettings = userRole === "owner";
  const canAccessQr = userRole === "owner";
  const canAccessTables =
    userRole === "owner" || userRole === "cashier" || userRole === "waiter";
  const canAccessBankAccounts = userRole === "owner";
  const ownBusinesses = memberships.filter((membership) => !membership.tenant.is_demo);
  const demos = memberships.filter((membership) => membership.tenant.is_demo);

  function switchBusiness(selected: SidebarContentProps["memberships"][number]) {
    setActiveTenantId(selected.tenant_id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tlaco_activeTenantId", selected.tenant_id);
      } catch {
        /* incognito, quota, disabled */
      }
    }
    const pathParts = pathname.split("/").filter(Boolean);
    const section = pathParts[0] === "dashboard" && pathParts[1] && !["crear-negocio", "perfil", "plataforma"].includes(pathParts[1])
      ? pathParts.slice(2)
      : [];
    const destination = section.length > 0
      ? `/dashboard/${selected.tenant.slug}/${section.join("/")}`
      : `/dashboard/${selected.tenant.slug}`;
    onNavigate?.();
    router.push(destination);
  }

  async function createAnotherBusiness() {
    setExpansionError(null);
    if (userRole !== "owner") {
      setExpansionOpen(true);
      setExpansionError("Solo la persona propietaria puede crear otro negocio.");
      return;
    }
    setCheckingExpansion(true);
    try {
      const response = await fetch("/api/billing/business-expansion");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos validar tu plan");
      if (result.can_create) {
        onNavigate?.();
        router.push("/dashboard/crear-negocio");
        return;
      }
      setExpansionOpen(true);
    } catch (error) {
      setExpansionError(
        error instanceof Error ? error.message : "No pudimos validar tu plan.",
      );
      setExpansionOpen(true);
    } finally {
      setCheckingExpansion(false);
    }
  }

  async function activateOperation() {
    if (!activeTenantId) return;
    setActivatingOperation(true);
    setExpansionError(null);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: activeTenantId, plan_code: "operation" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos abrir el cobro");
      window.location.assign(result.checkout_url);
    } catch (error) {
      setExpansionError(
        error instanceof Error ? error.message : "No pudimos abrir el cobro.",
      );
      setActivatingOperation(false);
    }
  }

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border-soft px-4">
        {/* Sin `animated`: es una herramienta de uso diario y una caída de 1.5s
            en cada carga del panel es ruido. `TlacoLogo` ya trae su propio
            `sr-only` con el nombre, así que no lleva alt ni aria-label. */}
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center">
          <TlacoLogo size="md" />
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
      {!tenantsLoaded ? (
        <div className="shrink-0 border-b border-border-soft px-4 py-4" aria-busy="true" aria-label="Cargando negocios">
          <div className="animate-pulse space-y-2.5"><div className="h-3 w-24 rounded bg-border-soft" /><div className="h-12 w-full rounded-xl bg-border-soft" /><div className="h-11 w-full rounded-xl bg-border-soft" /></div>
        </div>
      ) : memberships.length > 0 && (
        <div className="shrink-0 border-b border-border-soft px-4 py-4">
          {memberships.length > 1 && <><label htmlFor="business-switcher" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Negocio activo</label><select
            id="business-switcher"
            value={activeTenantId ?? memberships[0]?.tenant_id ?? ""}
            onChange={(event) => {
              const selected = memberships.find((membership) => membership.tenant_id === event.target.value);
              if (selected) switchBusiness(selected);
            }}
            className="select-custom min-h-12 w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-label="Cambiar negocio activo"
          >
            {ownBusinesses.length > 0 && <optgroup label="Mis negocios">{ownBusinesses.map((membership) => <option key={membership.id} value={membership.tenant_id}>{membership.tenant.name}</option>)}</optgroup>}
            {demos.length > 0 && <optgroup label="Mis demos">{demos.map((membership) => <option key={membership.id} value={membership.tenant_id}>{membership.tenant.name} · Demo</option>)}</optgroup>}
          </select></>}
          <button
            type="button"
            onClick={() => void createAnotherBusiness()}
            disabled={checkingExpansion}
            className={`${memberships.length > 1 ? "mt-2" : ""} inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
          >
            <Plus className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            {checkingExpansion ? "Validando plan…" : "Crear otro negocio"}
          </button>
        </div>
      )}
      <nav className="flex min-h-0 flex-1 flex-col space-y-1 overflow-auto p-4">
        <NavLink
          href={hasTenant ? base : "/dashboard"}
          active={pathname === (hasTenant ? base : "/dashboard")}
          icon={Home}
          onNavigate={onNavigate}
        >
          Inicio
        </NavLink>
        {isPlatformAdmin && (
          <div className="mt-3 border-t border-border-soft pt-4">
            <div className="flex items-center justify-between px-3 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Plataforma
              </p>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                Super admin
              </span>
            </div>
            <NavLink
              href="/dashboard/plataforma"
              active={pathname === "/dashboard/plataforma" && platformView === "operation"}
              icon={ShieldCheck}
              onNavigate={onNavigate}
            >
              Operación
            </NavLink>
            <NavLink
              href="/dashboard/plataforma?view=users"
              active={pathname === "/dashboard/plataforma" && platformView === "users"}
              icon={Users}
              onNavigate={onNavigate}
            >
              Usuarios
            </NavLink>
            <NavLink
              href="/dashboard/plataforma?view=businesses"
              active={pathname === "/dashboard/plataforma" && platformView === "businesses"}
              icon={Building2}
              onNavigate={onNavigate}
            >
              Negocios
            </NavLink>
            <NavLink
              href="/dashboard/plataforma?view=audit"
              active={pathname === "/dashboard/plataforma" && platformView === "audit"}
              icon={ListChecks}
              onNavigate={onNavigate}
            >
              Auditoría
            </NavLink>
          </div>
        )}
        {hasTenant && (
          <>
            <p className="mt-4 border-t border-border-soft px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Gestión del negocio
            </p>
            <NavLink
              href={`${base}/productos`}
              active={
                pathname === `${base}/productos` ||
                pathname.startsWith(`${base}/productos/`)
              }
              icon={Package}
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
              icon={Scissors}
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
              icon={ClipboardList}
              onNavigate={onNavigate}
            >
              Órdenes / Tickets
            </NavLink>
            {/* Junto a Órdenes: es la misma mercancía, vista por hora de
                recolección en vez de por fecha de creación. */}
            <NavLink
              href={`${base}/agenda`}
              active={pathname === `${base}/agenda`}
              icon={CalendarClock}
              onNavigate={onNavigate}
            >
              Agenda
            </NavLink>
            <NavLink
              href={`${base}/suscripciones`}
              active={
                pathname === `${base}/suscripciones` ||
                pathname.startsWith(`${base}/suscripciones/`)
              }
              icon={Repeat}
              onNavigate={onNavigate}
            >
              Suscripciones
            </NavLink>
            {canAccessQr && (
              <NavLink
                href={`${base}/qr`}
                active={
                  pathname === `${base}/qr` ||
                  pathname.startsWith(`${base}/qr/`)
                }
                icon={QrCode}
                onNavigate={onNavigate}
              >
                Códigos QR
              </NavLink>
            )}
            {canAccessTables && (
              <NavLink
                href={`${base}/mesas`}
                active={
                  pathname === `${base}/mesas` ||
                  pathname.startsWith(`${base}/mesas/`)
                }
                icon={Table2}
                onNavigate={onNavigate}
              >
                Mesas
              </NavLink>
            )}

            <div className="mt-4 border-t border-border-soft pt-4">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Cobranza
              </p>
              <NavLink
                href={`${base}/prestamos`}
                active={
                  pathname === `${base}/prestamos` ||
                  pathname.startsWith(`${base}/prestamos/`)
                }
                icon={Banknote}
                onNavigate={onNavigate}
              >
                Préstamos
              </NavLink>
              <NavLink
                href={`${base}/clientes`}
                active={
                  pathname === `${base}/clientes` ||
                  pathname.startsWith(`${base}/clientes/`)
                }
                icon={Users}
                onNavigate={onNavigate}
              >
                Clientes
              </NavLink>
            </div>

            {canAccessTeamAndSettings && (
              <div className="mt-4 border-t border-border-soft pt-4">
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Administración
                </p>
                <NavLink
                  href={`${base}/ventas`}
                  active={
                    pathname === `${base}/ventas` ||
                    pathname.startsWith(`${base}/ventas/`)
                  }
                  icon={BarChart3}
                  onNavigate={onNavigate}
                >
                  Ventas y Comisiones
                </NavLink>
                <NavLink
                  href={`${base}/liquidaciones`}
                  active={
                    pathname === `${base}/liquidaciones` ||
                    pathname.startsWith(`${base}/liquidaciones/`)
                  }
                  icon={Wallet}
                  onNavigate={onNavigate}
                >
                  Mi dinero
                </NavLink>
                <NavLink
                  href={`${base}/equipo`}
                  active={
                    pathname === `${base}/equipo` ||
                    pathname.startsWith(`${base}/equipo/`)
                  }
                  icon={UsersRound}
                  onNavigate={onNavigate}
                >
                  Equipo
                </NavLink>
                <NavLink
                  href={`${base}/sitio-web`}
                  active={pathname === `${base}/sitio-web`}
                  icon={Globe}
                  onNavigate={onNavigate}
                >
                  Sitio web
                </NavLink>
                <NavLink
                  href={`${base}/configuracion`}
                  active={pathname === `${base}/configuracion`}
                  icon={Settings}
                  onNavigate={onNavigate}
                >
                  Configuración
                </NavLink>

                {canAccessBankAccounts && (
                  <NavLink
                    href={`${base}/configuracion/cuentas-bancarias`}
                    active={
                      pathname === `${base}/configuracion/cuentas-bancarias`
                    }
                    icon={Landmark}
                    onNavigate={onNavigate}
                  >
                    Cuentas bancarias
                  </NavLink>
                )}
                <NavLink
                  href={`${base}/novedades`}
                  active={pathname === `${base}/novedades`}
                  icon={Sparkles}
                  onNavigate={onNavigate}
                >
                  Novedades
                </NavLink>
              </div>
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
            className="flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
          >
            <Download className="h-5 w-5" />
            Instalar app
          </button>
        )}
        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full min-h-11 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
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
      <FormSheet
        isOpen={expansionOpen}
        onClose={() => {
          if (!activatingOperation) setExpansionOpen(false);
        }}
        dismissible={!activatingOperation}
        title="Crea otro negocio"
        description="Cada negocio mantiene su propio catálogo, equipo, mesas y cobros."
        icon={Sparkles}
        footer={
          <div className="space-y-2">
            {userRole === "owner" && (
              <button
                type="button"
                onClick={() => void activateOperation()}
                disabled={activatingOperation}
                className="min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activatingOperation ? "Abriendo Mercado Pago…" : "Activar Operación · $199/mes"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpansionOpen(false)}
              disabled={activatingOperation}
              className="min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground disabled:opacity-60"
            >
              Ahora no
            </button>
          </div>
        }
      >
        {expansionError ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{expansionError}</p>
        ) : (
          <div className="rounded-xl bg-accent/5 p-4">
            <p className="text-sm font-bold text-foreground">Operación incluye</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Crea y administra otro negocio.</li>
              <li>• Hasta 20 mesas activas.</li>
              <li>• Un kiosko para tomar pedidos.</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">No se cobra aquí: primero revisarás y autorizarás el pago en Mercado Pago.</p>
          </div>
        )}
      </FormSheet>
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
  const searchParams = useSearchParams();
  const profile = useSessionStore((s) => s.profile);
  const memberships = useTenantStore((s) => s.memberships);
  const tenantsLoaded = useTenantStore((s) => s.tenantsLoaded);
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);
  const activeTenant = useActiveTenant();
  const { isInstallable, install } = usePwaInstall();

  const slug = tenantSlug ?? activeTenant?.slug ?? null;
  const base = slug ? `/dashboard/${slug}` : "/dashboard";
  const hasTenant = !!slug;
  const requestedPlatformView = searchParams.get("view");
  const platformView: SidebarContentProps["platformView"] =
    requestedPlatformView === "users" ||
    requestedPlatformView === "businesses" ||
    requestedPlatformView === "audit"
      ? requestedPlatformView
      : "operation";

  const sidebarContentProps = {
    pathname,
    platformView,
    slug,
    base,
    hasTenant,
    tenantsLoaded,
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
      <aside className="hidden h-screen max-h-screen w-64 shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-border-soft bg-surface md:flex">
        <SidebarContent {...sidebarContentProps} />
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
