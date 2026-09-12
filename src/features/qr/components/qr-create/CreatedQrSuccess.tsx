"use client";

import { CheckCircle2 } from "lucide-react";

import { QrPreview } from "@/features/qr/components/qr-create/QrPreview";
import { btnPrimary, btnSecondary } from "@/components/ui/buttonClasses";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface CreatedQrSuccessProps {
  qr: QrCode;
  onCreateAnother: () => void;
  onDone: () => void;
}

export function CreatedQrSuccess({ qr, onCreateAnother, onDone }: CreatedQrSuccessProps) {
  const isTable = qr.kind === "table";
  const doneLabel = isTable ? "Ir a Mesas" : "Ver listado de QR";

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {isTable ? "Mesa creada" : "Código QR creado"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Escanea el código o copia la URL para probarlo.
        </p>
      </div>

      <QrPreview
        token={qr.token}
        label={qr.label}
        kind={qr.kind}
        tableCapacity={qr.table_capacity}
        presetAmount={qr.preset_amount}
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onCreateAnother}
          className={`${btnSecondary} w-full sm:w-auto`}
        >
          {isTable ? "Crear otra mesa" : "Crear otro QR"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className={`${btnPrimary} w-full sm:w-auto`}
        >
          {doneLabel}
        </button>
      </div>
    </div>
  );
}
