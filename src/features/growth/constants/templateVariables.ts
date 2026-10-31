import type { TemplateChannel, TemplateStep } from "@/features/growth/interfaces/template";
import type { WhatsappStep } from "@/features/growth/interfaces/whatsapp";

export const TEMPLATE_VARIABLES: Array<{ key: string; label: string }> = [
  { key: "saludo", label: "Buenos días / tardes / noches" },
  { key: "negocio", label: "Nombre del negocio" },
  { key: "colonia", label: "Colonia" },
  { key: "municipio", label: "Municipio" },
  { key: "cercania", label: "Frase de cercanía por municipio" },
  { key: "giro", label: "Giro" },
  { key: "giro_plural", label: "Giro en plural" },
  { key: "giro_linea", label: "Qué trae su tienda de ejemplo" },
  { key: "giro_beneficio", label: "Beneficio del giro" },
  { key: "giro_pregunta", label: "Pregunta del giro" },
  { key: "link", label: "Link a su «Para ti»" },
  { key: "firma", label: "Firma" },
  { key: "nombre", label: "Nombre de quien escribe" },
  { key: "espacio", label: "Tu negocio (quien prospecta)" },
  { key: "oferta", label: "Tu oferta (Motor)" },
];

export const TEMPLATE_VARIABLE_KEYS = new Set(TEMPLATE_VARIABLES.map((variable) => variable.key));

export const TEMPLATE_STEPS: Record<TemplateChannel, Array<{ value: TemplateStep; label: string }>> = {
  whatsapp: [
    { value: "m1", label: "Primer mensaje" },
    { value: "seguimiento", label: "Seguimiento (día 3)" },
    { value: "vio_tienda", label: "Vio su tienda y no contestó" },
    { value: "si", label: "Cuando responde" },
    { value: "objecion_costo", label: "Duda: ¿cuánto cuesta?" },
    { value: "objecion_tiempo", label: "Duda: no tengo tiempo" },
    { value: "objecion_duda", label: "Duda: no sé si me sirve" },
    { value: "objecion_whatsapp", label: "Duda: ya vendo por WhatsApp" },
    { value: "visita_confirmar", label: "Pidió visita" },
    { value: "cita_recordatorio", label: "Recordatorio de cita" },
    { value: "post_visita", label: "Después de la visita" },
    { value: "ultimo", label: "Último mensaje" },
    { value: "activacion_tienda", label: "Activación: terminar su tienda" },
    { value: "activacion_mp", label: "Activación: conectar Mercado Pago" },
    { value: "activacion_venta", label: "Activación: primera venta" },
  ],
  email: [
    { value: "d0", label: "Correo 1 · día 0" },
    { value: "d3", label: "Correo 2 · día 3" },
    { value: "d7", label: "Correo 3 · día 7" },
  ],
};

/** Steps that only make sense with the prospect's link in them. */
export const STEPS_REQUIRING_LINK: TemplateStep[] = ["seguimiento", "si", "vio_tienda", "objecion_costo", "objecion_whatsapp", "post_visita", "ultimo", "d3", "d7"];

export const WHATSAPP_STEPS: WhatsappStep[] = TEMPLATE_STEPS.whatsapp.map((option) => option.value as WhatsappStep);

export const WHATSAPP_MAX_CHARS = 1000;
export const EMAIL_SUBJECT_MAX_CHARS = 120;
