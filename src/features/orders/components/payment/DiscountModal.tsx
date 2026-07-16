"use client";

import { useState, useEffect } from "react";
import { Check, Percent, DollarSign, Trash2 } from "lucide-react";
import type { DiscountModalProps } from "@/features/orders/interfaces/orderModals";

export function DiscountModal({
  isOpen,
  onClose,
  onApply,
  onRemove,
  subtotal,
  currentDiscount,
  loading,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "fixed",
  );
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (currentDiscount > 0) {
      setDiscountType("fixed");
      setInputValue(String(currentDiscount));
    } else {
      setDiscountType("fixed");
      setInputValue("");
    }
  }, [isOpen, currentDiscount]);

  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const numericValue = parseFloat(inputValue) || 0;
  const calculatedDiscount =
    discountType === "percentage"
      ? Math.round(((subtotal * Math.min(numericValue, 100)) / 100) * 100) / 100
      : Math.min(numericValue, subtotal);
  const newTotal = Math.max(subtotal - calculatedDiscount, 0);
  const isValid =
    numericValue > 0 &&
    (discountType === "percentage"
      ? numericValue <= 100
      : numericValue <= subtotal);

  function handleApply() {
    if (!isValid || loading) return;
    onApply(calculatedDiscount);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex flex-col justify-end md:items-center md:justify-center bg-black/60 p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[92vh] flex flex-col overflow-hidden rounded-t-2xl border-t border-border bg-surface-raised shadow-lg md:max-w-sm md:max-h-none md:rounded-xl md:border"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex shrink-0 justify-center pt-3 md:hidden">
          <div
            className="h-1 w-12 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-2 md:pt-6">
        <h3
          id="discount-modal-title"
          className="text-base font-semibold text-foreground"
        >
          Configurar descuento
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Elige el tipo y valor a aplicar.
        </p>

        <div className="mt-4 flex w-full rounded-lg border border-border bg-background/40 p-0.5">
          <button
            type="button"
            onClick={() => {
              setDiscountType("percentage");
              setInputValue("");
            }}
            className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-200 ${
              discountType === "percentage"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={discountType === "percentage"}
          >
            <Percent className="h-3 w-3 shrink-0" aria-hidden />
            Porcentaje
          </button>
          <button
            type="button"
            onClick={() => {
              setDiscountType("fixed");
              setInputValue("");
            }}
            className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-200 ${
              discountType === "fixed"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-pressed={discountType === "fixed"}
          >
            <DollarSign className="h-3 w-3 shrink-0" aria-hidden />
            Monto fijo
          </button>
        </div>

        <div className="mt-3">
          <label
            htmlFor="discount-value"
            className="block text-xs font-medium text-muted-foreground"
          >
            {discountType === "percentage"
              ? "Porcentaje de descuento"
              : "Monto de descuento"}
          </label>
          <div className="mt-1 flex items-center rounded-lg border border-border bg-white px-3 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <span className="shrink-0 text-sm text-muted-foreground">
              {discountType === "fixed" ? "$" : "%"}
            </span>
            <input
              id="discount-value"
              type="number"
              min="0"
              max={discountType === "percentage" ? 100 : subtotal}
              step="0.01"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              disabled={loading}
              placeholder="0.00"
              className="min-h-[40px] w-full bg-transparent px-2 text-sm tabular-nums text-foreground outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
              autoFocus
            />
          </div>
          {numericValue > 0 && !isValid && (
            <p className="mt-1 text-xs text-red-600">
              {discountType === "percentage"
                ? "El porcentaje debe ser entre 1 y 100"
                : `El monto no puede ser mayor a $${subtotal.toFixed(2)}`}
            </p>
          )}
        </div>

        {numericValue > 0 && (
          <div className="mt-3 rounded-lg bg-background/40 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums text-foreground">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Descuento</span>
              <span className="tabular-nums font-medium text-red-600">
                -${calculatedDiscount.toFixed(2)}
                {discountType === "percentage" && (
                  <span className="ml-1 text-muted-foreground">
                    ({numericValue}%)
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between border-t border-border/80 pt-1.5">
              <span className="text-sm font-semibold text-foreground">
                Nuevo total
              </span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                ${newTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        </div>
        <div className="shrink-0 flex flex-col-reverse gap-2 px-4 pt-2 pb-4 md:flex-row md:gap-3 md:px-6 md:pt-4 md:pb-6 md:border-t md:border-border-soft">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:max-w-[140px] md:border md:border-border"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!isValid || loading}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:bg-accent/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              "Aplicando..."
            ) : (
              <>
                <Check className="h-5 w-5 shrink-0" aria-hidden />
                Aplicar
              </>
            )}
          </button>
        </div>
        {currentDiscount > 0 && (
          <div className="shrink-0 px-4 pb-2">
            <button
              type="button"
              onClick={() => onRemove()}
              disabled={loading}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1 py-2 text-xs font-medium text-red-500 transition-colors duration-200 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3 shrink-0" aria-hidden />
              Quitar descuento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
