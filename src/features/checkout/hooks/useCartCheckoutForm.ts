import { useState } from "react";
import * as yup from "yup";

import {
  checkoutPickup,
  checkoutSubscription,
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
}

const INITIAL_FORM: CheckoutFormState = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
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

  return {
    form,
    fieldErrors,
    error,
    submitting,
    setError,
    updateField,
    handleSubmit,
  };
}
