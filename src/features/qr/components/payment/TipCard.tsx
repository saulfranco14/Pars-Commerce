"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Heart,
  Landmark,
  Loader2,
  Smartphone,
} from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { formatCurrency } from "@/features/qr/helpers/format";

const METHODS = [
  ["efectivo", "Efectivo", Banknote],
  ["transferencia", "Transferencia", Landmark],
  ["tarjeta", "Tarjeta", CreditCard],
  ["mercadopago", "Mercado Pago", Smartphone],
] as const;

type TipMethod = (typeof METHODS)[number][0];

interface TipCardProps {
  orderId: string;
  total: number;
  fingerprint: string;
  onDone: () => void;
}

/**
 * Selecting a payment method is deliberately reversible. The server is only
 * called after the customer reviews the amount + method and taps Confirmar.
 */
export function TipCard({
  orderId,
  total,
  fingerprint,
  onDone,
}: TipCardProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"percent" | "amount">("percent");
  const [percent, setPercent] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<TipMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = useMemo(() => {
    const value =
      mode === "percent"
        ? percent == null
          ? 0
          : (total * percent) / 100
        : Number(custom);
    return Number.isFinite(value) && value > 0
      ? Math.round(value * 100) / 100
      : 0;
  }, [custom, mode, percent, total]);
  const selectedMethod = METHODS.find(([id]) => id === method);

  function close() {
    if (submitting) return;
    setOpen(false);
    setError(null);
  }

  async function confirmTip() {
    if (!method || !amount || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/qr/table/tip", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-fingerprint-id": fingerprint,
        },
        body: JSON.stringify({ order_id: orderId, amount, method }),
      });
      const result = (await response.json()) as {
        error?: string;
        init_point?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "No se pudo registrar la propina.");
        return;
      }
      if (result.init_point) {
        window.location.href = result.init_point;
        return;
      }
      setOpen(false);
      onDone();
    } catch {
      setError("No pudimos conectar. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 transition-colors hover:bg-accent/90 active:scale-[0.99]"
      >
        <Heart className="h-5 w-5" aria-hidden />
        Dejar propina
      </button>

      <FormSheet
        isOpen={open}
        onClose={close}
        title="¿Deseas dejar propina?"
        description="Gracias por reconocer la atención recibida."
        icon={Heart}
        maxWidth="max-w-md"
        dismissible={!submitting}
        footer={
          <div className="space-y-2">
            <p className="text-center text-xs font-semibold text-muted-foreground">
              {selectedMethod
                ? `${formatCurrency(amount)} · ${selectedMethod[1]}`
                : "Elige el método para continuar"}
            </p>
            <button
              type="button"
              onClick={() => void confirmTip()}
              disabled={!amount || !method || submitting}
              className="flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <Heart className="h-5 w-5" aria-hidden />
              )}
              {submitting
                ? "Registrando propina..."
                : `Confirmar propina de ${formatCurrency(amount)}`}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 rounded-xl bg-border-soft/60 p-1">
            <button
              type="button"
              onClick={() => setMode("percent")}
              className={`min-h-10 rounded-lg text-xs font-bold transition-colors ${
                mode === "percent"
                  ? "bg-surface text-accent shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Porcentaje
            </button>
            <button
              type="button"
              onClick={() => setMode("amount")}
              className={`min-h-10 rounded-lg text-xs font-bold transition-colors ${
                mode === "amount"
                  ? "bg-surface text-accent shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              Monto en pesos
            </button>
          </div>

          {mode === "percent" ? (
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={percent === value}
                  onClick={() => setPercent(value)}
                  className={`min-h-11 rounded-xl border text-sm font-bold transition-colors ${
                    percent === value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface text-foreground hover:bg-border-soft/40"
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          ) : (
            <input
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              inputMode="decimal"
              placeholder="Ej. 25.00"
              aria-label="Monto de propina en pesos"
              className="min-h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          )}

          <div className="rounded-xl bg-border-soft/40 px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              Propina
            </span>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(amount)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-foreground">
              ¿Cómo quieres darla?
            </p>
            {METHODS.map(([id, label, Icon]) => {
              const selected = method === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setMethod(id);
                    setError(null);
                  }}
                  className={`flex min-h-13 w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 text-left text-sm font-bold transition-colors ${
                    selected
                      ? "border-accent bg-accent/5 text-foreground"
                      : "border-border bg-surface text-foreground hover:bg-border-soft/40"
                  }`}
                >
                  <Icon className="h-5 w-5 text-accent" aria-hidden />
                  <span className="flex-1">{label}</span>
                  {selected && (
                    <CheckCircle2
                      className="h-5 w-5 text-accent"
                      aria-label="Seleccionado"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          )}
        </div>
      </FormSheet>
    </>
  );
}
