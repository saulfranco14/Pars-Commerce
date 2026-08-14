"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

interface WhatsAppShareButtonProps {
  tenantId: string;
  entityType: "order" | "loan" | "subscription" | "appointment";
  entityId: string;
  recipientPhone: string | null | undefined;
  eventType?: string;
  className?: string;
}

/** Central internal action: logging a share is separate from any payment flow. */
export function WhatsAppShareButton({ tenantId, entityType, entityId, recipientPhone, eventType = "whatsapp_opened", className = "" }: WhatsAppShareButtonProps) {
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
  return <div className="space-y-1"><button type="button" onClick={() => void share()} disabled={loading || !recipientPhone} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}><MessageCircle className="h-4 w-4" aria-hidden />{loading ? "Abriendo…" : "Compartir por WhatsApp"}</button>{error && <p role="alert" className="text-xs text-red-600">{error}</p>}</div>;
}
