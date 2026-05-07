"use client";

interface FormState {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

interface CheckoutFormFieldsProps {
  idPrefix: string;
  form: FormState;
  fieldErrors: Record<string, string>;
  onUpdate: (field: keyof FormState, value: string) => void;
}

const inputBaseClass =
  "mt-1 w-full min-h-[44px] rounded-xl border bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2";

function inputClass(hasError: boolean): string {
  return `${inputBaseClass} ${
    hasError
      ? "border-red-500 focus:ring-red-500/20"
      : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
  }`;
}

/**
 * Inputs del formulario de checkout: Nombre, Email y Teléfono. Maneja
 * placeholder en blanco y limita el teléfono a 12 dígitos sin permitir
 * caracteres no numéricos.
 */
export function CheckoutFormFields({
  idPrefix,
  form,
  fieldErrors,
  onUpdate,
}: CheckoutFormFieldsProps) {
  return (
    <>
      <div>
        <label
          htmlFor={`${idPrefix}checkout-name`}
          className="block text-sm font-medium text-gray-700"
        >
          Nombre
        </label>
        <input
          id={`${idPrefix}checkout-name`}
          type="text"
          autoComplete="name"
          value={form.customer_name}
          onChange={(e) => onUpdate("customer_name", e.target.value)}
          className={inputClass(Boolean(fieldErrors.customer_name))}
          placeholder="Tu nombre"
        />
        {fieldErrors.customer_name && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.customer_name}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}checkout-email`}
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id={`${idPrefix}checkout-email`}
          type="email"
          autoComplete="email"
          value={form.customer_email}
          onChange={(e) => onUpdate("customer_email", e.target.value)}
          className={inputClass(Boolean(fieldErrors.customer_email))}
          placeholder="correo@ejemplo.com"
        />
        {fieldErrors.customer_email && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.customer_email}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}checkout-phone`}
          className="block text-sm font-medium text-gray-700"
        >
          Teléfono
        </label>
        <input
          id={`${idPrefix}checkout-phone`}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel"
          maxLength={12}
          value={form.customer_phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
            onUpdate("customer_phone", digits);
          }}
          className={inputClass(Boolean(fieldErrors.customer_phone))}
          placeholder="5512345678"
        />
        {fieldErrors.customer_phone && (
          <p className="mt-1 text-sm text-red-600">
            {fieldErrors.customer_phone}
          </p>
        )}
      </div>
    </>
  );
}
