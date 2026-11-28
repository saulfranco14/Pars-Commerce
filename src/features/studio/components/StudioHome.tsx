"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { useStudioContinuation } from "../hooks/useStudioContinuation";
import { PageHeader } from "@/components/admin/PageHeader";
import { Notification } from "@/components/ui/Notification";
import { useStudioContext } from "./StudioProvider";
import { StudioLoading } from "./StudioLoading";
import { StudioPendingBanner } from "./StudioPendingBanner";
import { StudioShelf } from "./StudioShelf";
import { StudioWelcome } from "./StudioWelcome";

export function StudioHome() {
  useStudioContinuation();
  const { tenantSlug, summary, isLoading, error, refresh } = useStudioContext();
  const base = `/dashboard/${tenantSlug}/studio`;
  // Back from an ad, the list shows what was just published or finished.
  useEffect(() => {
    void refresh();
    // Once per visit to Studio's home.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (isLoading) return <StudioLoading />;
  if (error || !summary)
    return (
      <Notification
        tone="error"
        message={error?.message ?? "No pudimos cargar Studio."}
      />
    );
  const canCreate =
    summary.enabled && summary.permissions.includes("studio.create");
  return (
    <div className="space-y-6">
      <PageHeader
        compact
        title="Crear"
        action={
          <Link
            href={`${base}/tlacos`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent/10 px-3 text-sm font-bold text-accent"
          >
            <Coins className="h-4 w-4" aria-hidden />
            {summary.balance.available} Tlacos
          </Link>
        }
      />
      {summary.membership?.ai_blocked && (
        <Notification
          tone="warning"
          message="Hay un pago en revisión. Las imágenes con IA están pausadas y tu contenido se conserva."
        />
      )}
      {!summary.enabled && (
        <Notification
          tone="info"
          message="La creación está temporalmente no disponible. Puedes consultar tu biblioteca y descargar tus archivos."
        />
      )}
      <StudioPendingBanner onFinished={() => void refresh()} />
      {canCreate && <StudioWelcome />}
      {canCreate ? (
        <StudioShelf />
      ) : summary.enabled ? (
        <Notification
          tone="info"
          message="Para crear anuncios necesitas permiso de Studio. El propietario puede dártelo desde Equipo."
        />
      ) : null}
    </div>
  );
}
