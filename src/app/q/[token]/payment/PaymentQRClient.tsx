"use client";

import { useState } from "react";

import { BankTransferPanel } from "@/features/qr/components/BankTransferPanel";
import { PaymentAmountForm } from "@/features/qr/components/PaymentAmountForm";
import type { PaymentAmountValues } from "@/features/qr/validations/paymentAmountSchema";

interface PaymentQRClientProps {
  token: string;
  tenant: { id: string; name: string; slug: string };
  qrCode: {
    id: string;
    label: string;
    preset_amount: number | null;
  };
}

export function PaymentQRClient({ tenant, qrCode }: PaymentQRClientProps) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(values: PaymentAmountValues) {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/qr/payment-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          customer_name: values.customer_name,
          customer_email: values.customer_email,
          amount: values.amount,
          qr_code_id: qrCode.id,
        }),
      });
      const data = (await res.json()) as {
        redirect_url?: string;
        payment_link?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "No se pudo procesar el pago");
      const url = data.redirect_url ?? data.payment_link;
      if (url) window.location.href = url;
      setMessage("Pago generado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg space-y-4 px-4 py-6">
      <header>
        <p className="text-sm text-muted-foreground">{tenant.name}</p>
        <h1 className="text-2xl font-semibold text-foreground">{qrCode.label}</h1>
      </header>

      {message && (
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
          {message}
        </div>
      )}

      <PaymentAmountForm
        defaultAmount={qrCode.preset_amount}
        onSubmit={onSubmit}
        submitting={submitting}
      />

      <BankTransferPanel bankName={null} accountHolder={null} clabe={null} />
    </main>
  );
}
