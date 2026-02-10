"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSessionStore } from "@/stores/useSessionStore";
import type { Profile } from "@/types/database";
import { update as updateProfile } from "@/services/profileService";

export default function PerfilPage() {
  const profile = useSessionStore((s) => s.profile);
  const setProfile = useSessionStore((s) => s.setProfile);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const data = (await updateProfile({
        display_name: displayName.trim() || undefined,
        phone: phone.trim() || undefined,
      })) as Profile;
      setProfile(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-zinc-500">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Volver al dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900">Mi perfil</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Edita tu nombre y datos de contacto.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Cambios guardados.
          </div>
        )}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-zinc-700"
          >
            Nombre
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={profile.email ?? ""}
            readOnly
            className="mt-1 block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            El email no se puede cambiar desde aquí.
          </p>
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-zinc-700"
          >
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            placeholder="555 123 4567"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
