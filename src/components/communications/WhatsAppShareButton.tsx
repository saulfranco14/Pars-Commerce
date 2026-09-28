"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { btnSecondary } from "@/components/ui/buttonClasses";

interface WhatsAppShareButtonProps {
  tenantId: string;
  entityType: "order" | "loan" | "subscription" | "appointment";
  entityId: string;
  recipientPhone: string | null | undefined;
  eventType?: string;
  className?: string;
  buttonClassName?: string;
}

/** Central internal action: logging a share is separate from any payment flow. */
export function WhatsAppShareButton({
  tenantId,
  entityType,
  entityId,
  recipientPhone,
  eventType = "whatsapp_opened",
  className = "",
  buttonClassName = "",
}: WhatsAppShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const share = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/communications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, entity_type: entityType, entity_id: entityId, recipient_phone: recipientPhone, event_type: eventType }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos abrir WhatsApp.");
      window.open(result.whatsapp_url, "_blank", "noopener,noreferrer");
    } catch (value) {
      setError(value instanceof Error ? value.message : "No pudimos abrir WhatsApp.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={`space-y-1 ${className}`}>
      <button
        type="button"
        onClick={() => void share()}
        disabled={loading || !recipientPhone}
        className={`${btnSecondary} min-h-12 rounded-xl px-4 py-3 font-semibold active:scale-[0.98] ${buttonClassName}`}
      >
        <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden />
        {loading ? "Abriendo WhatsApp…" : "Compartir por WhatsApp"}
      </button>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
