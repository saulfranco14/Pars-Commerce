import { QrCode as QrIcon } from "lucide-react";

import { PaymentQRClient } from "./payment/PaymentQRClient";
import { TableSession } from "./table/TableSession";

import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";

interface QrResolveResponse {
  tenant: { id: string; name: string; slug: string };
  kind: "payment" | "table";
  qr_code: {
    id: string;
    label: string;
    token: string;
    preset_amount: number | null;
  };
  order?: {
    id: string;
    status: string;
  };
  menu?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface QrPageProps {
  params: Promise<{ token: string }>;
}

type ResolveResult =
  | { ok: true; data: QrResolveResponse }
  | { ok: false; status: number; message: string };

async function getSession(token: string): Promise<ResolveResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let response: Response;
  try {
    response = await fetch(
      `${baseUrl}/api/qr/resolve?token=${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );
  } catch {
    return {
      ok: false,
      status: 0,
      message: "No pudimos conectarnos. Verifica tu conexión a internet.",
    };
  }

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? "Este código QR no está disponible o fue desactivado."
        : response.status === 403
          ? "El negocio no tiene la tienda pública activa todavía."
          : "Ocurrió un problema al cargar este QR.";
    let message = fallback;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // keep fallback
    }
    return { ok: false, status: response.status, message };
  }

  return { ok: true, data: (await response.json()) as QrResolveResponse };
}

async function getActivePaymentMethod(
  tenantId: string,
): Promise<TenantPaymentMethod | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = await fetch(
    `${baseUrl}/api/tenant-payment-methods?tenant_id=${encodeURIComponent(tenantId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  const methods = (await response.json()) as TenantPaymentMethod[];
  return methods.find((m) => m.is_active && m.kind === "bank_transfer") ?? null;
}

function QrUnavailable({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <QrIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-foreground">
          Código QR no disponible
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Si crees que es un error, contacta al negocio que te entregó este QR.
        </p>
      </div>
    </main>
  );
}

export default async function QrPage({ params }: QrPageProps) {
  const { token } = await params;
  const result = await getSession(token);

  if (!result.ok) {
    return <QrUnavailable message={result.message} />;
  }

  const session = result.data;

  if (session.kind === "payment") {
    const activePaymentMethod = await getActivePaymentMethod(session.tenant.id);
    return (
      <PaymentQRClient
        token={token}
        tenant={session.tenant}
        qrCode={session.qr_code}
        activePaymentMethod={activePaymentMethod}
      />
    );
  }

  // For "table" we hand off to the client wrapper so the fingerprint (which
  // lives in localStorage) can be sent to /api/qr/resolve. This is required to
  // persist the device row and surface the customer's saved display_name.
  return <TableSession token={token} />;
}
