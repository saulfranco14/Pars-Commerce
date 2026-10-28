import type { ParaLinkEvent, ParaPlacement, ParaSection } from "@/features/growth/interfaces/para";
import type { SitePagePurchaseStep } from "@/types/tenantSitePages";

export const PARA_LINK_EVENTS: ParaLinkEvent[] = ["para_viewed", "para_seconds", "para_left", "claim_clicked", "help_clicked"];

/** Page order, so a visit summary reads top to bottom. */
export const PARA_SECTION_LABEL: Record<ParaSection, string> = {
  intro: "presentación",
  tienda: "su tienda",
  productos: "productos",
  cierre: "cierre",
};

export const PARA_PLACEMENT_LABEL: Record<ParaPlacement, string> = {
  bar: "arriba",
  intro: "en la presentación",
  final: "al final",
};

export const PARA_PLACEMENT_BY_LAYOUT = { bar: "bar", intro: "intro", block: "final" } as const satisfies Record<string, ParaPlacement>;

export const PARA_REPORTED_ITEMS = 5;
export const PARA_ITEM_NAME_MAX = 80;

export const PARA_OWNER_BENEFITS = [
  "Le hacen pedidos desde su celular, con entrega a domicilio o para recoger.",
  "Le pagan con tarjeta, sin terminal.",
  "Usted cambia precios, fotos y horarios cuando quiera.",
];

export const PARA_ACTIVATION_STEPS: SitePagePurchaseStep[] = [
  { title: "Crea su acceso", description: "Con su correo y su WhatsApp. Toma un par de minutos." },
  { title: "Su tienda queda lista", description: "Con estos productos; los cambia o agrega los suyos cuando quiera." },
  { title: "Comparte su link", description: "En su WhatsApp y con sus clientes, para que le pidan desde ahí." },
];
