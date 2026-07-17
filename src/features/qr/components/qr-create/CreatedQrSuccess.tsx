"use client";

import { CheckCircle2 } from "lucide-react";

import { QrPreview } from "@/features/qr/components/qr-create/QrPreview";

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

      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onCreateAnother}
          className="min-h-[44px] cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-border-soft/40"
        >
          {isTable ? "Crear otra mesa" : "Crear otro QR"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="min-h-[44px] cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
        >
          {doneLabel}
        </button>
      </div>
    </div>
  );
}
