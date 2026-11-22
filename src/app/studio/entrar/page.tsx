import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowRight, LogIn, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { studioDb } from "@/features/studio/services/studioDb";
import { requireStudioAccess } from "@/features/studio/services/studioAccessService";
import {
  studioEntryHref,
  studioLoginRegistrationHref,
} from "@/features/studio/helpers/entry";
import { uuidSchema } from "@/features/studio/validations/studioSchemas";
import { StudioEntryDenied } from "@/features/studio/components/landing/StudioEntryDenied";
import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";

export const metadata: Metadata = {
  title: "Entrar a Tlaco Studio",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function StudioEntryPage({
  searchParams,
}: {
  searchParams: Promise<{
    tenant?: string;
    studio_plan?: string;
    studio_action?: string;
  }>;
}) {
  const q = await searchParams,
    entry = studioEntryHref(q.studio_plan, q.studio_action),
    client = await createClient(),
    {
      data: { user },
    } = await client.auth.getUser();
  if (!user)
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
        <section className="w-full max-w-lg space-y-5 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <TlacoLogo size="lg" />
          <h1 className="text-3xl font-bold tracking-tight">
            Crea desde tu negocio.
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            Studio utiliza tu catálogo, marca y equipo de Tlaco. Entra con tu
            cuenta o crea tu negocio. La membresía Studio se elige después y
            requiere confirmación.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              className={adminActionButtonPrimary}
              href={`/login?next=${encodeURIComponent(entry)}`}
            >
              <LogIn className="h-4 w-4" />
              Ya tengo cuenta
            </Link>
            <Link
              className={adminActionButtonSecondary}
              href={studioLoginRegistrationHref(entry)}
            >
              <ArrowRight className="h-4 w-4" />
              Crear cuenta y negocio
            </Link>
          </div>
          <Link
            className="inline-flex min-h-11 items-center text-sm font-semibold text-accent"
            href="/studio"
          >
            Volver a conocer Studio
          </Link>
        </section>
      </main>
    );
  if (!q.tenant && (await isPlatformAdmin(user.id)))
    redirect("/dashboard/plataforma/studio/pruebas");
  const db = studioDb(),
    memberships = await db
      .from("tenant_memberships")
      .select("tenant_id")
      .eq("user_id", user.id);
  if (memberships.error) throw new Error("No pudimos cargar tus negocios.");
  const allowed = await Promise.all(
    (memberships.data ?? []).map(async (m) => ({
      id: m.tenant_id,
      allowed:
        (
          await db.rpc("studio_has_permission", {
            p_tenant_id: m.tenant_id,
            p_actor_id: user.id,
            p_permission: "studio.read",
          })
        ).data === true,
    })),
  );
  const ids = allowed.filter((m) => m.allowed).map((m) => m.id);
  if (q.tenant && !uuidSchema.safeParse(q.tenant).success) notFound();
  if (q.tenant && !ids.includes(q.tenant)) {
    if (
      memberships.data?.some((membership) => membership.tenant_id === q.tenant)
    )
      return <StudioEntryDenied />;
    notFound();
  }
  if (!memberships.data?.length)
    redirect(
      `/dashboard/crear-negocio?${studioLoginRegistrationHref(entry).split("?")[1]}`,
    );
  const tenants = ids.length
    ? ((await db.from("tenants").select("id,name,slug,settings").in("id", ids))
        .data ?? [])
    : [];
  const selected = q.tenant
    ? tenants.find((t) => t.id === q.tenant)
    : memberships.data?.length === 1 && tenants.length === 1
      ? tenants[0]
      : null;
  if (selected) {
    const setup = (
      selected.settings as { onboarding?: { status?: string } } | null
    )?.onboarding?.status;
    const access = await requireStudioAccess(selected.id);
    if (setup === "in_progress" && access.owner)
      redirect(`/dashboard/preparar-negocio?tenant=${selected.id}`);
    const target = `/dashboard/${encodeURIComponent(selected.slug)}/studio${q.studio_action !== "home" && (access.owner || access.permissions?.includes("studio.create")) ? "/nuevo" : ""}`;
    const continuation = new URLSearchParams({
      studio_action: q.studio_action === "home" ? "home" : "create",
    });
    if (q.studio_plan && ["basic", "pro", "business"].includes(q.studio_plan))
      continuation.set("studio_plan", q.studio_plan);
    const suffix = `?${continuation}`;
    redirect(target + suffix);
  }
  return (
    <main className="mx-auto min-h-dvh max-w-xl space-y-6 px-5 py-12">
      <TlacoLogo size="lg" />
      <h1 className="text-3xl font-bold tracking-tight">
        Elige el negocio de tu diseño.
      </h1>
      <p className="text-sm leading-7 text-muted-foreground">
        La membresía, los Tlacos y las publicaciones pertenecen al negocio que
        elijas.
      </p>
      {memberships.data && memberships.data.length > ids.length && (
        <p className="text-sm leading-6 text-muted-foreground">
          Otros negocios de tu cuenta no tienen acceso autorizado a Studio. Pide
          al propietario que revise tu invitación y los permisos desde Equipo.
        </p>
      )}
      {tenants.length ? (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              className="flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-5 font-semibold"
              href={`${entry}&tenant=${tenant.id}`}
            >
              <span className="flex items-center gap-3">
                <Store className="h-5 w-5 text-accent" />
                {tenant.name}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm leading-7">
          Tu cuenta no tiene permiso para consultar Studio. Pide al propietario
          que revise tu invitación y habilite el acceso desde Equipo.
        </p>
      )}
      <Link className={adminActionButtonSecondary} href="/dashboard">
        <ArrowRight className="h-4 w-4" />
        Ir a mi cuenta
      </Link>
    </main>
  );
}
