"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useAuthInitializer();
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
    <div className="dashboard-root flex min-h-screen bg-background">
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
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg bg-border-soft/70 text-foreground hover:bg-border-soft md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <main className="dashboard-main flex-1 px-4 py-4 sm:px-6 sm:py-6">
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
                className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
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
    </div>
  );
}
