"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  useTenantStore,
  useActiveTenant,
  useCanOpenSection,
} from "@/stores/useTenantStore";
import { dashboardSectionOf } from "@/constants/dashboardAccess";
import { menuPreferencesOf, resolveMenu } from "@/constants/dashboardMenu";
import { staffUsernameOf } from "@/lib/auth/staffLogin";
import { useIsPlatformAdmin } from "@/features/settlement/hooks/useIsPlatformAdmin";
import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { GROWTH_ROLE_LABEL } from "@/features/growth/constants/growthRoles";
import { ENGINE_PATH, FUNNEL_PATH, IMPORT_PATH, PROSPECTING_PATH, TEAM_PATH } from "@/features/growth/constants/routes";
import { isPlatformRoute, isProspectingRoute } from "@/lib/platformRoutes";
import {
  X,
  Download,
  Home,
  Users,
  ShieldCheck,
  Building2,
  ListChecks,
  Sparkles,
  Plus,
  SlidersHorizontal,
  Target,
  Landmark,
  Send,
  Filter,
} from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { FormSheet } from "@/components/ui/FormSheet";
import type { BillingPlan } from "@/features/billing/entitlements";

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
  const canOpen = useCanOpenSection();
  if (!canOpen(dashboardSectionOf(href))) return null;

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
  platformView: "operation" | "users" | "businesses" | "audit" | "liquidaciones";
  slug: string | null;
  base: string;
  hasTenant: boolean;
  tenantsLoaded: boolean;
  memberships: {
    id: string;
    tenant_id: string;
    tenant: {
      name: string;
      slug: string;
      business_type?: string | null;
      is_demo?: boolean | null;
      theme_color?: string | null;
    };
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
  const { actor: growthActor, isCoordinator } = useGrowthMe();
  const [expansionOpen, setExpansionOpen] = useState(false);
  const [checkingExpansion, setCheckingExpansion] = useState(false);
  const [activatingOperation, setActivatingOperation] = useState(false);
  const [expansionError, setExpansionError] = useState<string | null>(null);
  const [operationPlan, setOperationPlan] = useState<BillingPlan | null>(null);
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
  // Account ownership (other businesses, billing) stays an owner check; menu visibility is by permission.
  const canOpen = useCanOpenSection();
  // The business arranges its menu; each role still only sees what it can open.
  const activeTenant = useActiveTenant();
  const menuGroups = resolveMenu(menuPreferencesOf(activeTenant?.settings), canOpen);
  const onProspecting = Boolean(growthActor) && isProspectingRoute(pathname);
  const onPlatform = (isPlatformAdmin && isPlatformRoute(pathname)) || onProspecting;
  const prospectingSection = [TEAM_PATH, IMPORT_PATH, ENGINE_PATH, FUNNEL_PATH].find((path) => pathname.startsWith(path));
  const showTenantMenu = hasTenant && !onPlatform;

  function switchBusiness(
    selected: SidebarContentProps["memberships"][number],
  ) {
    setActiveTenantId(selected.tenant_id);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tlaco_activeTenantId", selected.tenant_id);
      } catch {
        /* incognito, quota, disabled */
      }
    }
    const pathParts = pathname.split("/").filter(Boolean);
    const section =
      pathParts[0] === "dashboard" &&
      pathParts[1] &&
      !["crear-negocio", "perfil", "plataforma"].includes(pathParts[1])
        ? pathParts.slice(2)
        : [];
    const destination =
      section.length > 0
        ? `/dashboard/${selected.tenant.slug}/${section.join("/")}`
        : `/dashboard/${selected.tenant.slug}`;
    onNavigate?.();
    router.push(destination);
  }

  async function createAnotherBusiness() {
    setExpansionError(null);
    if (userRole !== "owner") {
      setExpansionOpen(true);
      setExpansionError(
        "Solo la persona propietaria puede crear otro negocio.",
      );
      return;
    }
    setCheckingExpansion(true);
    try {
      const response = await fetch("/api/billing/business-expansion");
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "No pudimos validar tu plan");
      if (result.can_create) {
        onNavigate?.();
        router.push("/dashboard/crear-negocio");
        return;
      }
      const plansResponse = await fetch("/api/public/billing-plans");
      const plansPayload = await plansResponse.json();
      if (plansResponse.ok && Array.isArray(plansPayload)) {
        setOperationPlan(
          plansPayload.find((plan: BillingPlan) => plan.code === "operation") ??
            null,
        );
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
        body: JSON.stringify({
          tenant_id: activeTenantId,
          plan_code: "operation",
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "No pudimos abrir el cobro");
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
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center"
        >
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
      {onPlatform ? null : !tenantsLoaded ? (
        <div
          className="shrink-0 border-b border-border-soft px-4 py-4"
          aria-busy="true"
          aria-label="Cargando negocios"
        >
          <div className="animate-pulse space-y-2.5">
            <div className="h-3 w-24 rounded bg-border-soft" />
            <div className="h-12 w-full rounded-xl bg-border-soft" />
            <div className="h-11 w-full rounded-xl bg-border-soft" />
          </div>
        </div>
      ) : (
        memberships.length > 0 && (
          <>
            {memberships.length > 1 && (
              <div className="shrink-0 border-b border-border-soft px-4 py-4 mb-1">
                <label
                  htmlFor="business-switcher"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Negocio activo
                </label>
                <select
                  id="business-switcher"
                  value={activeTenantId ?? memberships[0]?.tenant_id ?? ""}
                  onChange={(event) => {
                    const selected = memberships.find(
                      (membership) =>
                        membership.tenant_id === event.target.value,
                    );
                    if (selected) switchBusiness(selected);
                  }}
                  className="select-custom min-h-12 w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  aria-label="Cambiar negocio activo"
                >
                  <optgroup label="Mis negocios">
                    {memberships.map((membership) => (
                      <option key={membership.id} value={membership.tenant_id}>
                        {membership.tenant.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}
            {userRole === "owner" && (
              <button
                type="button"
                onClick={() => void createAnotherBusiness()}
                disabled={checkingExpansion}
                className={`${memberships.length > 1 ? "mt-2" : ""} inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`}
              >
                <Plus className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                {checkingExpansion ? "Validando plan…" : "Crear otro negocio"}
              </button>
            )}
          </>
        )
      )}
      <nav className="flex min-h-0 flex-1 flex-col space-y-1 overflow-auto p-4">
        {!onPlatform && (
          <NavLink
            href={hasTenant ? base : "/dashboard"}
            active={pathname === (hasTenant ? base : "/dashboard")}
            icon={Home}
            onNavigate={onNavigate}
          >
            Inicio
          </NavLink>
        )}
        {isPlatformAdmin && (
          <div className={onPlatform ? "" : "mt-3 border-t border-border-soft pt-4"}>
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
              active={
                pathname === "/dashboard/plataforma" &&
                platformView === "operation"
              }
              icon={ShieldCheck}
              onNavigate={onNavigate}
            >
              Operación
            </NavLink>
            <NavLink
              href="/dashboard/plataforma?view=users"
              active={
                pathname === "/dashboard/plataforma" && platformView === "users"
              }
              icon={Users}
              onNavigate={onNavigate}
            >
              Usuarios
            </NavLink>
            <NavLink
              href="/dashboard/plataforma?view=businesses"
              active={
                pathname === "/dashboard/plataforma" &&
                platformView === "businesses"
              }
              icon={Building2}
              onNavigate={onNavigate}
            >
              Negocios
            </NavLink>
            <NavLink
              href="/dashboard/plataforma?view=audit"
              active={
                pathname === "/dashboard/plataforma" && platformView === "audit"
              }
              icon={ListChecks}
              onNavigate={onNavigate}
            >
              Auditoría
            </NavLink>
            <NavLink
              href="/dashboard/plataforma?view=liquidaciones"
              active={pathname === "/dashboard/plataforma" && platformView === "liquidaciones"}
              icon={Landmark}
              onNavigate={onNavigate}
            >
              Liquidaciones
            </NavLink>
          </div>
        )}
        {growthActor && (
          <div className={onPlatform && !isPlatformAdmin ? "" : "mt-3 border-t border-border-soft pt-4"}>
            <div className="flex items-center justify-between px-3 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Prospección
              </p>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                {GROWTH_ROLE_LABEL[growthActor.role]}
              </span>
            </div>
            <NavLink
              href={PROSPECTING_PATH}
              active={isProspectingRoute(pathname) && !prospectingSection}
              icon={Target}
              onNavigate={onNavigate}
            >
              Prospectos
            </NavLink>
            {isCoordinator && (
              <>
                <NavLink href={TEAM_PATH} active={prospectingSection === TEAM_PATH} icon={Users} onNavigate={onNavigate}>
                  Equipo
                </NavLink>
                <NavLink href={IMPORT_PATH} active={prospectingSection === IMPORT_PATH} icon={Download} onNavigate={onNavigate}>
                  Importar
                </NavLink>
                <NavLink href={ENGINE_PATH} active={prospectingSection === ENGINE_PATH} icon={Send} onNavigate={onNavigate}>
                  Motor
                </NavLink>
                <NavLink href={FUNNEL_PATH} active={prospectingSection === FUNNEL_PATH} icon={Filter} onNavigate={onNavigate}>
                  Embudo
                </NavLink>
              </>
            )}
          </div>
        )}
        {showTenantMenu &&
          menuGroups.map((group) => (
            <div key={group.key}>
              <p className="mt-4 border-t border-border-soft px-3 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
              {group.items.map((item) => {
                const href = `${base}/${item.path}`;
                return (
                  <NavLink
                    key={item.path}
                    href={href}
                    active={pathname === href || (Boolean(item.matchChildren) && pathname.startsWith(`${href}/`))}
                    icon={item.icon}
                    onNavigate={onNavigate}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        {showTenantMenu && canOpen("configuracion") && (
          <Link
            href={`${base}/configuracion/menu`}
            onClick={onNavigate}
            className="mt-3 flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-border-soft/60 hover:text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
            Personalizar menú
          </Link>
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
            <p className="truncate text-xs text-muted">{staffUsernameOf(profile.email) ?? profile.email}</p>
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
                {activatingOperation
                  ? "Abriendo Mercado Pago…"
                  : operationPlan
                    ? `Activar Operación · $${operationPlan.amount_mxn.toLocaleString("es-MX")}/mes`
                    : "Revisar precio de Operación"}
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
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {expansionError}
          </p>
        ) : (
          <div className="rounded-xl bg-accent/5 p-4">
            <p className="text-sm font-bold text-foreground">
              Operación incluye
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Crea y administra otro negocio.</li>
              <li>
                • Hasta {operationPlan?.entitlements.active_table_limit ?? "—"}{" "}
                mesas activas.
              </li>
              <li>
                • {operationPlan?.entitlements.active_kiosk_limit ?? "—"} kiosco
                para tomar pedidos.
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              No se cobra aquí: primero revisarás y autorizarás el pago en
              Mercado Pago.
            </p>
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
    requestedPlatformView === "audit" ||
    requestedPlatformView === "liquidaciones"
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
