"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { Sidebar } from "@/components/layout/Sidebar";
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-zinc-50">
      <Sidebar
        tenantSlug={tenantSlug}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onSignOut={handleSignOut}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 safe-area-inset-left">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
        </header>
        <main className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6">
          {pathname === "/dashboard/crear-negocio" ||
          pathname === "/dashboard/perfil" ? (
            children
          ) : memberships.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center">
              <h2 className="text-lg font-semibold text-zinc-900">
                Sin negocios
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Crea tu primer negocio para empezar.
              </p>
              <Link
                href="/dashboard/crear-negocio"
                className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Crear negocio
              </Link>
            </div>
          ) : !activeTenantId ? (
            <div className="text-sm text-zinc-600">
              Selecciona un negocio en el menú.
            </div>
          ) : activeTenant ? (
            children
          ) : (
            <div className="text-sm text-zinc-600">Cargando negocio...</div>
          )}
        </main>
      </div>
    </div>
  );
}
