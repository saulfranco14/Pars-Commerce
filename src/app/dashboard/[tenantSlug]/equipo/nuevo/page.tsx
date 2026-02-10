"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";

interface RoleOption {
  id: string;
  name: string;
}

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
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [invitedByEmail, setInvitedByEmail] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!activeTenant?.id) return;
    fetch(`/api/tenant-roles?tenant_id=${encodeURIComponent(activeTenant.id)}`)
      .then((res) => res.json())
      .then((list: RoleOption[]) => {
        const assignable = (list ?? []).filter((r) => r.name !== "owner");
        setRoles(assignable);
        if (assignable.length && !roleId) setRoleId(assignable[0].id);
      })
      .catch(() => setRoles([]));
  }, [activeTenant?.id]);

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
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: activeTenant.id,
          role_id: roleId,
          email: email.trim(),
          display_name: displayName.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error al agregar");
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
      <div className="text-sm text-zinc-600">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  if (invitedByEmail) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
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
          <div className="rounded-lg border border-green-300 bg-white p-3">
            <p className="text-xs text-zinc-600">
              Si no llega el correo en unos minutos, revisar carpeta de spam o
              reenviar desde Supabase Dashboard → Authentication → Users.
            </p>
          </div>
          <button
            onClick={() => {
              router.push(`/dashboard/${tenantSlug}/equipo`);
              router.refresh();
            }}
            className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Volver a equipo
          </button>
        </div>
      </div>
    );
  }

  if (tempPassword) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
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
          <div className="rounded-lg border border-green-300 bg-white p-4">
            <p className="mb-2 text-sm font-medium text-zinc-900">
              Contraseña temporal:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs font-medium text-yellow-800">
              ⚠️ Importante:
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
          <button
            onClick={() => {
              router.push(`/dashboard/${tenantSlug}/equipo`);
              router.refresh();
            }}
            className="mt-6 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Volver a equipo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <Link
          href={`/dashboard/${tenantSlug}/equipo`}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Volver a equipo
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">Agregar miembro</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Si el usuario no existe, se le enviará una invitación por correo para
        que establezca su contraseña y se agregará al equipo.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-zinc-700"
          >
            Nombre <span className="font-normal text-zinc-400">(opcional)</span>
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="Nombre de la persona"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            Email del usuario
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="usuario@ejemplo.com"
          />
        </div>
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-zinc-700"
          >
            Rol
          </label>
          <select
            id="role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {roleId && (
            <p className="mt-1 text-xs text-zinc-500">
              {ROLE_DESCRIPTIONS[
                roles.find((r) => r.id === roleId)?.name ?? ""
              ] ?? ""}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Agregando..." : "Agregar"}
          </button>
          <Link
            href={`/dashboard/${tenantSlug}/equipo`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
