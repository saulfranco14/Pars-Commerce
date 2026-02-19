"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { FormSaveBar } from "@/components/layout/FormSaveBar";
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
    <div className="w-full mx-auto flex min-h-0 max-w-5xl flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border pb-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <h1 className="mt-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Mi perfil
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Edita tu nombre y datos de contacto.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col pb-24 md:pb-0"
        >
          <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-8 sm:p-8 sm:pb-8 md:p-10 md:pb-8">
            {error && (
              <div className="mb-6 rounded-xl bg-red-50 px-5 py-4 text-base text-red-700 alert-error">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 rounded-xl bg-green-50 px-5 py-4 text-base text-green-700 alert-success">
                Cambios guardados.
              </div>
            )}
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-base font-medium text-muted-foreground"
                >
                  Nombre
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-form mt-2 block w-full min-h-[52px] rounded-xl border border-border px-4 py-3 text-lg text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-base font-medium text-muted-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile.email ?? ""}
                  readOnly
                  className="input-form mt-2 block w-full min-h-[52px] rounded-xl border border-border px-4 py-3 text-lg text-muted bg-border-soft/80 focus:outline-none"
                  aria-readonly
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  El email no se puede cambiar desde aquí.
                </p>
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-base font-medium text-muted-foreground"
                >
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-form mt-2 block w-full min-h-[52px] rounded-xl border border-border px-4 py-3 text-lg text-foreground placeholder:text-muted transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:border-accent focus-visible:ring-accent/20"
                  placeholder="555 123 4567"
                />
              </div>
            </div>
          </div>
          <FormSaveBar>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-base font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:min-w-[140px]"
            >
              <Check className="h-5 w-5 shrink-0" aria-hidden />
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </FormSaveBar>
        </form>
      </div>
    </div>
  );
}
