"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthInitializer } from "@/hooks/useAuthInitializer";
import { useSessionStore } from "@/stores/useSessionStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login?next=/dashboard");
        return;
      }
      if (memberships.length > 0 && !activeTenantId) {
        setActiveTenantId(memberships[0].tenant_id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when length/activeTenantId change
  }, [memberships.length, activeTenantId, setActiveTenantId, router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-zinc-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar tenantSlug={tenantSlug} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end border-b border-zinc-200 bg-white px-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Salir
          </button>
        </header>
        <main className="flex-1 px-4 py-6">
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
