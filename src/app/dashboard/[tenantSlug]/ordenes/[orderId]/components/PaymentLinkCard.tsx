"use client";

import { useOrder } from "../hooks/useOrder";
import { useState } from "react";
import { Link, Copy, Check, ExternalLink } from "lucide-react";

export function PaymentLinkCard() {
  const { order } = useOrder();
  const [copied, setCopied] = useState(false);

  if (!order?.payment_link) return null;
  if (!["pending_payment", "paid"].includes(order.status)) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(order.payment_link!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = order.payment_link!;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isPaid = order.status === "paid";

  return (
    <div
      className={`rounded-xl border p-5 ${
        isPaid
          ? "border-emerald-500/30 bg-emerald-950/20"
          : "border-blue-500/30 bg-blue-950/20"
      }`}
    >
      <div className="mb-3 flex items-center gap-2">
        <Link
          size={18}
          className={isPaid ? "text-emerald-400" : "text-blue-400"}
        />
        <h3 className="text-sm font-semibold text-white">
          {isPaid ? "Pago recibido" : "Link de pago"}
        </h3>
        {isPaid && (
          <span className="ml-auto rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-medium text-emerald-300">
            Pagado
          </span>
        )}
        {!isPaid && (
          <span className="ml-auto rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-medium text-amber-300">
            Pendiente
          </span>
        )}
      </div>

      {!isPaid && (
        <p className="mb-3 text-xs text-white/50">
          Envía este link al cliente para que realice el pago por MercadoPago.
        </p>
      )}

      <div className="flex items-center gap-2 rounded-lg bg-white/5 p-2.5">
        <input
          type="text"
          value={order.payment_link}
          readOnly
          className="min-w-0 flex-1 truncate border-none bg-transparent text-xs text-white/70 outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
          title="Copiar link"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-400" />
              Copiado
            </>
          ) : (
            <>
              <Copy size={14} />
              Copiar
            </>
          )}
        </button>
        <a
          href={order.payment_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
          title="Abrir link"
        >
          <ExternalLink size={14} />
          Abrir
        </a>
      </div>
    </div>
  );
}
