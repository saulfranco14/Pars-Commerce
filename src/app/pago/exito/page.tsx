"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

function PaymentResultContent() {
  const params = useSearchParams();
  const status = params.get("status") ?? "approved";
  const collectionStatus = params.get("collection_status") ?? status;

  const isApproved =
    collectionStatus === "approved" || collectionStatus === "accredited";
  const isPending =
    collectionStatus === "pending" ||
    collectionStatus === "in_process" ||
    collectionStatus === "in_mediation";

  if (isApproved) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            ¡Pago recibido!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu pago fue procesado correctamente. El negocio ya fue notificado.
          </p>
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Pago en proceso
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tu pago está siendo revisado. Te avisaremos cuando se confirme.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Pago no completado
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No pudimos procesar tu pago. Intenta de nuevo o contacta al negocio.
        </p>
      </div>
    </div>
  );
}

export default function PagoExitoPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <span className="text-sm font-semibold text-muted-foreground tracking-wide">
            Pars Commerce
          </span>
        </div>
        <Suspense fallback={null}>
          <PaymentResultContent />
        </Suspense>
      </div>
    </div>
  );
}
