import { notFound } from "next/navigation";
import { PaymentQRClient } from "./payment/PaymentQRClient";
import { TableQRClient } from "./table/TableQRClient";

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

async function getSession(token: string): Promise<QrResolveResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const response = await fetch(
    `${baseUrl}/api/qr/resolve?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  return (await response.json()) as QrResolveResponse;
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

export default async function QrPage({ params }: QrPageProps) {
  const { token } = await params;
  const session = await getSession(token);

  if (!session) notFound();

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

  return (
    <TableQRClient
      token={token}
      tenant={session.tenant}
      qrCode={session.qr_code}
      order={session.order ?? null}
      menu={session.menu ?? []}
    />
  );
}
