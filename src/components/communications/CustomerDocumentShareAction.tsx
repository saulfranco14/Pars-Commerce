"use client";

import { useState } from "react";
import { Copy, Mail, MessageCircle } from "lucide-react";

type Props = { tenantId: string; entityType: "quote" | "order" | "loan_payment" | "credit_account"; entityId: string; customerPhone?: string | null; customerEmail?: string | null; className?: string };

export function CustomerDocumentShareAction({ tenantId, entityType, entityId, customerPhone, customerEmail, className = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function createLink(delivery?: "email", recipientEmail?: string) {
    setLoading(true); setMessage(null);
    try {
      const response = await fetch("/api/customer-documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, entity_type: entityType, entity_id: entityId, delivery, recipient_email: recipientEmail }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos crear el comprobante.");
      return result.url as string;
    } finally { setLoading(false); }
  }
  async function copy() { try { const url = await createLink(); if (!url) return; await navigator.clipboard.writeText(url); setMessage("Liga copiada."); } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos copiar la liga."); } }
  async function whatsapp() { try { const url = await createLink(); if (!url) return; if (!customerPhone) throw new Error("Agrega el teléfono del cliente para compartir por WhatsApp."); const response = await fetch("/api/communications/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, entity_type: entityType, entity_id: entityId, recipient_phone: customerPhone, event_type: "document_whatsapp_opened", share_url: url }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "No pudimos abrir WhatsApp."); window.open(result.whatsapp_url, "_blank", "noopener,noreferrer"); } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos abrir WhatsApp."); } }
  async function email() { try { if (!customerEmail) throw new Error("Agrega el correo del cliente para enviar el comprobante."); const response = await fetch("/api/customer-documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: tenantId, entity_type: entityType, entity_id: entityId, delivery: "email", recipient_email: customerEmail }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "No pudimos preparar el correo."); setMessage(result.email_delivery === "sent" ? "Comprobante enviado por correo." : "Comprobante preparado. El correo quedará pendiente de reintento."); } catch (error) { setMessage(error instanceof Error ? error.message : "No pudimos preparar el correo."); } }
  return <div className={`space-y-2 ${className}`}><div className="grid grid-cols-2 gap-2 sm:flex"><button type="button" onClick={() => void whatsapp()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground disabled:opacity-50"><MessageCircle className="h-4 w-4" />WhatsApp</button><button type="button" onClick={() => void email()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground disabled:opacity-50"><Mail className="h-4 w-4" />Correo</button><button type="button" onClick={() => void copy()} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground disabled:opacity-50"><Copy className="h-4 w-4" />Copiar</button></div>{message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}</div>;
}
