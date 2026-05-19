"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useActiveTenant } from "@/stores/useTenantStore";
import { QrCreateForm } from "@/features/qr/components/QrCreateForm";
import { CreatedQrSuccess } from "@/features/qr/components/CreatedQrSuccess";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

export default function NewQrPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const [createdQr, setCreatedQr] = useState<QrCode | null>(null);

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  function handleCreateAnother() {
    setCreatedQr(null);
  }

  function handleDone() {
    if (createdQr?.kind === "table") {
      router.push(`/dashboard/${tenantSlug}/mesas`);
    } else {
      router.push(`/dashboard/${tenantSlug}/qr`);
    }
  }

  function handleCancel() {
    router.push(`/dashboard/${tenantSlug}/qr`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <button
        type="button"
        onClick={handleCancel}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al listado
      </button>

      {!createdQr ? (
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Nuevo código QR
          </h1>
          <p className="text-sm text-muted-foreground">
            Genera un QR para una mesa o un cobro libre. Después podrás imprimirlo o
            compartirlo.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        {createdQr ? (
          <CreatedQrSuccess
            qr={createdQr}
            onCreateAnother={handleCreateAnother}
            onDone={handleDone}
          />
        ) : (
          <QrCreateForm
            tenantId={activeTenant.id}
            tenantSlug={tenantSlug}
            defaultKind="payment"
            onSuccess={(qr) => setCreatedQr(qr)}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
