"use client";

import { useState } from "react";

import { QrCode as QrIcon } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { QrCreateForm } from "@/features/qr/components/QrCreateForm";
import { CreatedQrSuccess } from "@/features/qr/components/CreatedQrSuccess";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface QrCreateFormSheetProps {
  isOpen: boolean;
  tenantId: string;
  tenantSlug: string;
  onClose: () => void;
  onCreated: () => void;
}

/**
 * "Nuevo QR" — same icon-chip FormSheet used by Producto/Servicio/Equipo.
 * QrCreateForm keeps its own inline Guardar/Cancelar buttons (it owns a
 * self-contained create hook, unlike the other schema-driven forms where the
 * page owns useSchemaForm) — this sheet only supplies the icon-chip header
 * and the create → success two-step flow inside the same modal.
 */
export function QrCreateFormSheet({
  isOpen,
  tenantId,
  tenantSlug,
  onClose,
  onCreated,
}: QrCreateFormSheetProps) {
  const [createdQr, setCreatedQr] = useState<QrCode | null>(null);

  function handleClose() {
    setCreatedQr(null);
    onClose();
  }

  function handleDone() {
    setCreatedQr(null);
    onCreated();
    onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={handleClose}
      icon={QrIcon}
      title={createdQr ? (createdQr.kind === "table" ? "Mesa creada" : "Código QR creado") : "Nuevo QR"}
      description={
        createdQr
          ? undefined
          : "Genera un QR para una mesa o un cobro libre. Después podrás imprimirlo o compartirlo."
      }
      maxWidth="max-w-xl"
    >
      {createdQr ? (
        <CreatedQrSuccess
          qr={createdQr}
          onCreateAnother={() => setCreatedQr(null)}
          onDone={handleDone}
        />
      ) : (
        <QrCreateForm
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          defaultKind="payment"
          onSuccess={(qr) => {
            setCreatedQr(qr);
            onCreated();
          }}
          onCancel={handleClose}
        />
      )}
    </FormSheet>
  );
}
