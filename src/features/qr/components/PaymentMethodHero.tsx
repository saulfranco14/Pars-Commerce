"use client";

import { formatCurrency } from "@/features/qr/helpers/format";
import { PAYMENT_METHOD_META } from "@/features/qr/constants/paymentMethodMeta";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";

interface PaymentMethodHeroProps {
  method: CustomerPayMethod;
  amount: number;
}

/**
 * Hero block for the "Finalizar pago" screen.
 *
 * Pattern matches the canonical hero used across customer flows
 * (eyebrow + title + amount). Lives inside a `<CustomerScreenLayout>`
 * accent pane — never as a standalone surface.
 */
export function PaymentMethodHero({ method, amount }: PaymentMethodHeroProps) {
  const meta = PAYMENT_METHOD_META[method];
  const Icon = meta.icon;

  return (
    <div className="w-full text-center lg:text-left">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm lg:mx-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md">
          <Icon className={`h-6 w-6 ${meta.color}`} />
        </div>
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">
        Pago con {meta.label}
      </p>
      <p className="mt-1 text-5xl font-bold tracking-tight lg:text-6xl">
        {formatCurrency(amount)}
      </p>
    </div>
  );
}
