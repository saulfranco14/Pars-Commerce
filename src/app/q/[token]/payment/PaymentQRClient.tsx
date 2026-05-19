"use client";

import { useState } from "react";

import { TipScreen } from "@/features/qr/components/TipScreen";

import type { PaymentAmountValues } from "@/features/qr/validations/paymentAmountSchema";
import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";

interface PaymentQRClientProps {
  token: string;
  tenant: { id: string; name: string; slug: string };
  qrCode: {
    id: string;
    label: string;
    preset_amount: number | null;
  };
  activePaymentMethod: TenantPaymentMethod | null;
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
      if (url) {
        window.location.href = url;
        return;
      }
      setMessage("Pago generado correctamente.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TipScreen
      tenantName={tenant.name}
      qrLabel={qrCode.label}
      presetAmount={qrCode.preset_amount}
      submitting={submitting}
      message={message}
      onSubmit={onSubmit}
    />
  );
}
