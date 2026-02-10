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
        <p className="text-sm text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver al dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-foreground">Mi perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edita tu nombre y datos de contacto.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 alert-success">
            Cambios guardados.
          </div>
        )}
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-muted-foreground"
          >
            Nombre
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-muted-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={profile.email ?? ""}
            readOnly
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-muted bg-border-soft/80 focus:outline-none"
            aria-readonly
          />
          <p className="mt-1 text-xs text-muted-foreground">
            El email no se puede cambiar desde aquí.
          </p>
        </div>
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-muted-foreground"
          >
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-form mt-1 block w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="555 123 4567"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
