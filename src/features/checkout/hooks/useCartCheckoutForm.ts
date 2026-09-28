import { useState } from "react";
import * as yup from "yup";

import {
  checkoutPickup,
  checkoutSubscription,
  checkoutWhatsApp,
  requestOrder,
} from "@/services/publicCartService";
import { checkoutFormSchema } from "@/features/orders/validations/checkoutForm";
import type { MsiOption } from "@/constants/commissionConfig";

import {
  freqToValues,
  type CartFrequency,
} from "@/features/checkout/helpers/cartFrequency";
import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface CartCheckoutFormParams {
  tenantId: string;
  cartId: string | null;
  fingerprint: string | null;
  paymentMode: PaymentMode;
  selectedInstallments: number;
  selectedFrequency: CartFrequency;
  msiOption: MsiOption;
}

interface CheckoutFormState {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  /** ISO de la hora de recolección; `""` = pasa cuando esté listo. */
  scheduled_for: string;
}

const INITIAL_FORM: CheckoutFormState = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  scheduled_for: "",
};

export function useCartCheckoutForm({
  tenantId,
  cartId,
  fingerprint,
  paymentMode,
  selectedInstallments,
  selectedFrequency,
  msiOption,
}: CartCheckoutFormParams) {
  const [form, setForm] = useState<CheckoutFormState>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof CheckoutFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartId || !fingerprint) return;
    setError(null);
    setFieldErrors({});

    try {
      const validated = await checkoutFormSchema.validate(
        {
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          customer_phone: form.customer_phone.trim(),
        },
        { abortEarly: false },
      );
      setSubmitting(true);

      if (paymentMode === "single") {
        const result = await checkoutPickup(
          {
            tenant_id: tenantId,
            cart_id: cartId,
            customer_name: validated.customer_name,
            customer_email: validated.customer_email,
            customer_phone: validated.customer_phone,
            msi_option: msiOption,
            scheduled_for: form.scheduled_for || null,
          },
          fingerprint,
        );
        window.location.href = result.redirect_url;
        return;
      }

      const freqValues = freqToValues(selectedFrequency);
      const result = await checkoutSubscription(
        {
          tenant_id: tenantId,
          cart_id: cartId,
          customer_name: validated.customer_name,
          customer_email: validated.customer_email,
          customer_phone: validated.customer_phone,
          payment_mode: paymentMode,
          installments:
            paymentMode === "installments" ? selectedInstallments : undefined,
          frequency: freqValues.frequency,
          frequency_type: freqValues.frequency_type,
          msi_option: paymentMode === "installments" ? msiOption : undefined,
          scheduled_for: form.scheduled_for || null,
        },
        fingerprint,
      );
      window.location.href = result.init_point;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errs: Record<string, string> = {};
        err.inner.forEach((entry) => {
          if (entry.path) errs[entry.path] = entry.message;
        });
        setFieldErrors(errs);
      } else {
        setError(
          err instanceof Error ? err.message : "Error al finalizar pedido",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!cartId || !fingerprint) return;
    setError(null);
    setFieldErrors({});
    try {
      const validated = await checkoutFormSchema.validate({
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
      }, { abortEarly: false });
      setSubmitting(true);
      const idempotencyKey = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${cartId}-${Date.now()}`;
      const result = await checkoutWhatsApp({
        tenant_id: tenantId,
        cart_id: cartId,
        customer_name: validated.customer_name,
        customer_email: validated.customer_email,
        customer_phone: validated.customer_phone,
        scheduled_for: form.scheduled_for || null,
      }, fingerprint, idempotencyKey);
      window.location.assign(result.whatsapp_url);
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errs: Record<string, string> = {};
        err.inner.forEach((entry) => { if (entry.path) errs[entry.path] = entry.message; });
        setFieldErrors(errs);
      } else {
        setError(err instanceof Error ? err.message : "No pudimos preparar el pedido por WhatsApp.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestOrder = async () => {
    if (!cartId || !fingerprint) return;
    setError(null);
    setFieldErrors({});
    const name = form.customer_name.trim();
    const phone = form.customer_phone.replace(/\D/g, "");
    const email = form.customer_email.trim();
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.customer_name = "Indica tu nombre.";
    if (phone.length < 10 || phone.length > 15) errors.customer_phone = "Indica un teléfono válido.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.customer_email = "Email inválido.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    try {
      setSubmitting(true);
      const key = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${cartId}-${Date.now()}`;
      const result = await requestOrder({ tenant_id: tenantId, cart_id: cartId, customer_name: name, customer_phone: phone, customer_email: email || undefined, scheduled_for: form.scheduled_for || null }, fingerprint, key);
      window.location.assign(result.tracking_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar tu solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    fieldErrors,
    error,
    submitting,
    setError,
    updateField,
    handleSubmit,
    handleWhatsAppOrder,
    handleRequestOrder,
  };
}
