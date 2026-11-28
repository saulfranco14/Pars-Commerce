import type { ParaLinkEvent, ParaObjection, ParaObjectionOption, ParaPlacement, ParaSection, ParaVisitSlot } from "@/features/growth/interfaces/para";

/** Events the page reports on its own; a visit request goes through its own endpoint. */
export const PARA_LINK_EVENTS: ParaLinkEvent[] = ["para_viewed", "para_seconds", "para_left", "claim_clicked", "help_clicked", "objection_chosen", "ad_edited", "ads_downloaded", "ads_shared", "zone_opened", "signup_started"];

/** Page order, so a visit summary reads top to bottom. */
export const PARA_SECTION_LABEL: Record<ParaSection, string> = {
  anuncios: "sus anuncios",
  zona: "su zona",
  intro: "presentación",
  tienda: "su tienda",
  productos: "productos",
  dudas: "dudas",
  cierre: "cierre",
};

export const PARA_PLACEMENT_LABEL: Record<ParaPlacement, string> = {
  bar: "arriba",
  intro: "en la presentación",
  dudas: "en las dudas",
  final: "al final",
};

export const PARA_PLACEMENT_BY_LAYOUT = { bar: "bar", intro: "intro", block: "final" } as const satisfies Record<string, ParaPlacement>;

export const PARA_REPORTED_ITEMS = 5;
export const PARA_ITEM_NAME_MAX = 80;

export const PARA_OBJECTIONS: ParaObjectionOption[] = [
  {
    id: "costo",
    label: "¿Cuánto me va a costar?",
    answer: () =>
      "Activarla no cuesta y no pide tarjeta. Tlaco no le cobra comisión por lo que venda; si un cliente le paga con tarjeta, Mercado Pago cobra la suya por ese pago. Los planes con más funciones sólo se activan si usted los elige.",
    next: "claim",
  },
  {
    id: "tiempo",
    label: "Ahorita no tengo tiempo",
    answer: (who) => `${who} puede pasar a su local y dejársela lista en unos 15 minutos, sin costo.`,
    next: "visit",
  },
  {
    id: "duda",
    label: "No sé si me sirve",
    answer: (who) => `Cuéntele a ${who} qué vende y cómo le piden hoy sus clientes; le dirá con franqueza si le sirve.`,
    next: "help",
  },
  {
    id: "whatsapp",
    label: "Ya vendo por WhatsApp",
    answer: () => "Puede seguir igual: comparte su link por WhatsApp y sus clientes eligen ahí, con precio y foto, sin que usted conteste uno por uno.",
    next: "claim",
  },
];

export const PARA_OBJECTION_LABEL = Object.fromEntries(PARA_OBJECTIONS.map((option) => [option.id, option.label])) as Record<ParaObjection, string>;

export const PARA_VISIT_SLOT_LABEL: Record<ParaVisitSlot, string> = {
  manana: "en la mañana",
  tarde: "en la tarde",
};

export const PARA_VISIT_DAYS_SHOWN = 6;
/** A page left open overnight can still ask for a day it offered yesterday. */
export const PARA_VISIT_DAYS_ACCEPTED = 14;
