"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { ArrowLeft, Plus, AlertTriangle } from "lucide-react";
import { CreateEditPageLayout } from "@/components/layout/CreateEditPageLayout";
import type { TenantRoleOption } from "@/services/tenantRolesService";
import { swrFetcher } from "@/lib/swrFetcher";
import { addMember } from "@/services/teamService";

const tenantRolesKey = (tenantId: string) =>
  `/api/tenant-roles?tenant_id=${encodeURIComponent(tenantId)}`;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner:
    "Acceso total al negocio: ventas, productos, inventario, equipo y configuración.",
  member:
    "Puede gestionar ventas, órdenes y catálogo; no puede gestionar equipo ni configuración.",
};

export default function NuevoMiembroPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rolesKeyValue = activeTenant ? tenantRolesKey(activeTenant.id) : null;
  const { data: rolesData } = useSWR<TenantRoleOption[]>(
    rolesKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );
  const roles = Array.isArray(rolesData)
    ? rolesData.filter((r) => r.name !== "owner")
    : [];
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [invitedByEmail, setInvitedByEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (roles.length > 0 && !roleId) setRoleId(roles[0].id);
  }, [roles, roleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeTenant) return;
    if (!email.trim()) {
      setError("El email es requerido");
      return;
    }
    if (!roleId) {
      setError("Selecciona un rol");
      return;
    }
    setLoading(true);
    try {
      const data = (await addMember({
        tenant_id: activeTenant.id,
        role_id: roleId,
        email: email.trim(),
        display_name: displayName.trim() || undefined,
      })) as { invitedByEmail?: boolean; tempPassword?: string };
      if (data.invitedByEmail) {
        setInvitedByEmail(true);
      } else if (data.tempPassword) {
        setTempPassword(data.tempPassword);
      } else {
        router.push(`/dashboard/${tenantSlug}/equipo`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyPassword() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  if (invitedByEmail) {
    return (
      <div className="mx-auto flex min-h-0 max-w-lg flex-1 flex-col overflow-auto">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm alert-success">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-green-900">
              Invitación enviada
            </h2>
          </div>
          <p className="mb-4 text-sm text-green-800">
            Supabase ha enviado un correo de invitación a{" "}
            <strong>{email}</strong>. La persona debe abrir el enlace del correo
            y establecer su contraseña. Ya está agregada al equipo.
          </p>
          <div className="rounded-lg border border-green-300 bg-surface-raised p-3">
            <p className="text-xs text-muted-foreground">
              Si no llega el correo en unos minutos, revisar carpeta de spam o
              reenviar desde Supabase Dashboard → Authentication → Users.
            </p>
          </div>
          <Link
            href={`/dashboard/${tenantSlug}/equipo`}
            className="mt-6 inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Volver a equipo
          </Link>
        </div>
      </div>
    );
  }

  if (tempPassword) {
    return (
      <div className="mx-auto flex min-h-0 max-w-lg flex-1 flex-col overflow-auto">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm alert-success">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-green-900">
              Usuario creado exitosamente
            </h2>
          </div>
          <p className="mb-4 text-sm text-green-800">
            Se ha enviado un correo de confirmación a <strong>{email}</strong>.
            La persona debe confirmar su email antes de poder acceder.
          </p>
          <div className="rounded-lg border border-green-300 bg-surface-raised p-4">
            <p className="mb-2 text-sm font-medium text-foreground">
              Contraseña temporal:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border border-border bg-border-soft px-3 py-2 font-mono text-sm text-foreground">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="min-h-[44px] cursor-pointer rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-yellow-800">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              Importante:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-yellow-700">
              <li>
                • Envía esta contraseña a {email.split("@")[0]} por WhatsApp o
                email
              </li>
              <li>
                • La persona debe confirmar su email (revisar bandeja de
                entrada/spam)
              </li>
              <li>
                • Luego puede entrar con el email y esta contraseña temporal
              </li>
              <li>• Puede cambiar su contraseña desde su perfil</li>
            </ul>
          </div>
          <Link
            href={`/dashboard/${tenantSlug}/equipo`}
            className="mt-6 inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Volver a equipo
          </Link>
        </div>
      </div>
    );
  }

  const equipoHref = `/dashboard/${tenantSlug}/equipo`;

  return (
    <CreateEditPageLayout
      title="Agregar miembro"
      backHref={equipoHref}
      backLabel="Volver a equipo"
      description="Si el usuario no existe, se le enviará una invitación por correo para que establezca su contraseña y se agregue al equipo."
      cancelHref={equipoHref}
      createLabel="Agregar"
      loading={loading}
      loadingLabel="Agregando…"
      createIcon={<Plus className="h-4 w-4 shrink-0" aria-hidden />}
      error={error}
      onSubmit={handleSubmit}
    >
      <section className="rounded-xl bg-surface p-4 sm:p-6 md:p-8">
        <div className="space-y-4">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Nombre <span className="font-normal text-muted">(opcional)</span>
                </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
            placeholder="Nombre de la persona"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-muted-foreground"
          >
            Email del usuario
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
            placeholder="usuario@ejemplo.com"
          />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-muted-foreground"
          >
            Rol
          </label>
          <select
            id="role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="input-form select-custom mt-1 block w-full min-h-[44px] rounded-xl border border-border px-3 py-2.5 text-sm text-foreground transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {roleId && (
            <p className="mt-1 text-xs text-muted">
              {ROLE_DESCRIPTIONS[
                roles.find((r) => r.id === roleId)?.name ?? ""
              ] ?? ""}
            </p>
          )}
        </div>
        </div>
      </section>
    </CreateEditPageLayout>
  );
}
