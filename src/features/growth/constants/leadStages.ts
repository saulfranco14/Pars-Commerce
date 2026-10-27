import type { StatusTone } from "@/components/admin/StatusBadge";

import type { LeadStage, NextChannel } from "@/features/growth/interfaces/lead";

export const LEAD_STAGE_META: Record<LeadStage, { label: string; tone: StatusTone }> = {
  nuevo: { label: "Nuevo", tone: "neutral" },
  contactado: { label: "Contactado", tone: "info" },
  conversando: { label: "Conversando", tone: "info" },
  caliente: { label: "Caliente", tone: "warning" },
  registrado: { label: "Registrado", tone: "success" },
  sin_respuesta: { label: "Sin respuesta", tone: "neutral" },
  descartado: { label: "Descartado", tone: "danger" },
  sin_contacto: { label: "Sin contacto", tone: "neutral" },
};

export const NEXT_CHANNEL_LABEL: Record<NextChannel, string> = {
  whatsapp: "WhatsApp",
  visita: "Visita",
  correo: "Correo",
  ninguno: "Sin canal",
};

export const LEAD_EVENT_LABEL: Record<string, string> = {
  whatsapp_sent: "WhatsApp enviado",
  whatsapp_replied: "Respondió por WhatsApp",
  whatsapp_no_answer: "Sin respuesta por WhatsApp",
  no_whatsapp: "No tiene WhatsApp",
  wrong_number: "Número equivocado",
  email_sent: "Correo enviado",
  email_replied: "Respondió el correo",
  email_no_answer: "Sin respuesta por correo",
  email_bounced: "El correo rebotó",
  visit_registered: "Se registró en la visita",
  visit_interested: "Interesado en la visita",
  visit_absent: "No estaba el dueño",
  visit_closed: "Negocio cerrado",
  visit_stuck: "Se trabó en el registro",
  not_interested: "No le interesa",
  unsubscribed: "Se dio de baja",
  para_viewed: "Abrió su tienda",
  para_seconds: "Tiempo en su tienda",
  claim_clicked: "Tocó «Reclamar mi tienda»",
  help_clicked: "Pidió ayuda por WhatsApp",
  registered: "Se registró",
  phone_corrected: "Corregiste el teléfono",
};

export const LEAD_STAGE_TABS = [
  { value: "todos", label: "Todos" },
  { value: "contactado", label: "Contactados" },
  { value: "conversando", label: "Conversando" },
  { value: "caliente", label: "Calientes" },
  { value: "registrado", label: "Registrados" },
  { value: "descartado", label: "Descartados" },
] as const;

export const LEADS_PAGE_SIZE = 30;
