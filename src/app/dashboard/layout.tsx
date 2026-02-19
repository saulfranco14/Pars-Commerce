"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { useAuthProfileAndTenants } from "@/hooks/useAuthProfileAndTenants";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { btnPrimary } from "@/components/ui/buttonClasses";
import { isFocusRoute } from "@/lib/focusRoutes";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingOverlay";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useAuthInitializer();
  useAuthProfileAndTenants();
  const profile = useSessionStore((s) => s.profile);
  const memberships = useTenantStore((s) => s.memberships);
  const tenantsLoaded = useTenantStore((s) => s.tenantsLoaded);
  const activeTenantId = useTenantStore((s) => s.activeTenantId);
  const setActiveTenantId = useTenantStore((s) => s.setActiveTenantId);
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const pathParts = pathname.split("/").filter(Boolean);
  const tenantSlug =
    pathParts[0] === "dashboard" &&
    pathParts[1] &&
    pathParts[1] !== "crear-negocio" &&
    pathParts[1] !== "perfil"
      ? pathParts[1]
      : null;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!tenantSlug || memberships.length === 0) return;
    const match = memberships.find(
      (m) => (m.tenant as { slug?: string })?.slug === tenantSlug,
    );
    if (match && match.tenant_id !== activeTenantId) {
      setActiveTenantId(match.tenant_id);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("pars_activeTenantId", match.tenant_id);
        } catch {
          /* ignore */
        }
      }
    }
  }, [tenantSlug, memberships, activeTenantId, setActiveTenantId]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingBlock message="Cargando sesión…" />
      </div>
    );
  }

  return (
    <div className="dashboard-root no-print flex min-h-screen bg-background">
      <div className="no-print md:fixed md:left-0 md:top-0 md:z-20 md:h-screen md:w-56">
        <Sidebar
          tenantSlug={tenantSlug}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
          onSignOut={handleSignOut}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col md:ml-56">
        <header
          className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border-soft bg-surface px-4"
          style={{ paddingLeft: "max(1rem, env(safe-area-inset-left, 1rem))" }}
        >
          <Link
            href="/dashboard"
            className="font-semibold text-foreground md:hidden"
          >
            Pars Commerce
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main
          className={`dashboard-main flex-1 px-4 py-4 sm:px-6 sm:py-6 md:pb-6 ${
            isFocusRoute(pathname) ? "pb-6" : "pb-24"
          }`}
        >
          {pathname === "/dashboard/crear-negocio" ||
          pathname === "/dashboard/perfil" ? (
            children
          ) : !tenantsLoaded ? (
            <LoadingBlock message="Cargando negocios…" />
          ) : memberships.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface-raised p-6 text-center">
              <h2 className="text-lg font-semibold text-foreground">
                Sin negocios
              </h2>
              <p className="mt-2 text-sm text-muted">
                Crea tu primer negocio para empezar.
              </p>
              <Link
                href="/dashboard/crear-negocio"
                className={`mt-4 ${btnPrimary}`}
              >
                Crear negocio
              </Link>
            </div>
          ) : !activeTenantId ? (
            <div className="text-sm text-muted">
              Selecciona un negocio en el menú.
            </div>
          ) : activeTenant ? (
            children
          ) : (
            <div className="text-sm text-muted">Cargando negocio...</div>
          )}
        </main>
      </div>
      {!isFocusRoute(pathname) &&
        tenantsLoaded &&
        memberships.length > 0 && (
          <BottomNav
            onMoreClick={() => setMobileMenuOpen(true)}
            ordersBadgeCount={0}
          />
        )}

      {/* Onboarding — shown once to new users, feels native on mobile & desktop */}
      <OnboardingOverlay />
    </div>
  );
}
