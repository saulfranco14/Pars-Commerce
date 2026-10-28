import type { GrowthLead, LeadLastTouch } from "@/features/growth/interfaces/lead";

type TouchLead = Pick<GrowthLead, "phone_status" | "email_status" | "whatsapp_attempts" | "last_whatsapp_at" | "para_viewed_at">;

export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

/** What happened last with this prospect, so a row says "WhatsApp enviado hace 2 h" without opening it. */
export function leadLastTouch(lead: TouchLead, now: Date = new Date()): LeadLastTouch | null {
  if (lead.para_viewed_at) return { label: `Abrió su tienda ${timeAgo(lead.para_viewed_at, now)}`, tone: "warning" };
  if (lead.phone_status === "respondio") return { label: "Respondió por WhatsApp", tone: "success" };
  if (lead.phone_status === "sin_whatsapp") return { label: "Sin WhatsApp", tone: "neutral" };
  if (lead.phone_status === "equivocado") return { label: "Número equivocado", tone: "danger" };
  if (lead.last_whatsapp_at && lead.whatsapp_attempts > 0) {
    const what = lead.whatsapp_attempts > 1 ? "Seguimiento enviado" : "WhatsApp enviado";
    return { label: `${what} ${timeAgo(lead.last_whatsapp_at, now)}`, tone: "info" };
  }
  if (lead.email_status === "rebotado") return { label: "El correo rebotó", tone: "neutral" };
  if (lead.email_status === "enviado") return { label: "Correo enviado", tone: "info" };
  return null;
}
