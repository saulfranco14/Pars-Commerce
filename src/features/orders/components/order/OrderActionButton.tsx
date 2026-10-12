"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2, type LucideIcon } from "lucide-react";

import {
  orderActionClass,
  type OrderActionTone,
} from "@/features/orders/constants/orderActionStyles";

type OrderActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children"
> & {
  tone: OrderActionTone;
  icon: LucideIcon;
  loading?: boolean;
  children: ReactNode;
};

/** Botón estándar para todas las acciones operativas de una orden. */
export function OrderActionButton({
  tone,
  icon: Icon,
  loading = false,
  disabled,
  children,
  ...buttonProps
}: OrderActionButtonProps) {
  return (
    <button
      {...buttonProps}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={orderActionClass(tone)}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Icon className="h-4 w-4" aria-hidden />
      )}
      {children}
    </button>
  );
}
