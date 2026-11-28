import { formatBusinessName, isGenericBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { giroAdCopy } from "@/features/growth/constants/prospectAds";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";
import { senderFromSignature } from "@/features/growth/helpers/paraSender";
import { adBusinessName, formatAdPrice, sanitizeAdEdits } from "@/features/growth/helpers/prospectAds";

import type { AdEdits } from "@/features/growth/interfaces/prospectAds";
import type { TemplateVars } from "@/features/growth/interfaces/template";

export function greetingFor(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Hour of the day in Mexico City, whatever the server timezone is. */
export function mexicoHour(now: Date): number {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Mexico_City" }).format(now));
}

interface LeadForVars {
  business_name: string;
  giro: string;
  municipio: string;
  colonia: string | null;
  address: string | null;
}

export interface TemplateExtra {
  link: string;
  firma: string;
  espacio?: string;
  oferta?: string;
  now?: Date;
  /** What the owner changed in their gift ads, so {promo} quotes their price. */
  adEdits?: AdEdits;
  /** Same-giro businesses within 500 m; null when the lead has no location. */
  nearby?: number | null;
}

/** «hay 17 cafeterías a 500 m de usted», with the singular and the empty case written out. */
export function zonePhrase(count: number | null | undefined, giro: string): string {
  const copy = giroCopy(giro);
  if (count == null) return "hay otros negocios de su giro cerca de usted";
  if (count === 0) return `no hay otro negocio de su giro a 500 m de usted`;
  if (count === 1) return `hay otro negocio de su giro a 500 m de usted`;
  return `hay ${count} ${copy.plural} a 500 m de usted`;
}

export function buildTemplateVars(lead: LeadForVars, extra: TemplateExtra): TemplateVars {
  const copy = giroCopy(lead.giro);
  const adCopy = giroAdCopy(lead.giro);
  const zone = zoneByMunicipio(lead.municipio);
  const street = lead.address?.trim();
  const negocio = isGenericBusinessName(lead.business_name) && street
    ? `${copy.label.toLowerCase()} de ${formatBusinessName(street)}`
    : formatBusinessName(lead.business_name);
  const saludo = greetingFor(mexicoHour(extra.now ?? new Date()));
  const adName = adBusinessName(lead.business_name, lead.giro);
  const promo = sanitizeAdEdits(extra.adEdits).promo;

  return {
    saludo,
    // Without a real name the greeting doesn't guess one.
    saludo_negocio: adName ? `${saludo}, ¿es ${adName}?` : `${saludo}.`,
    pregunta_precio: adCopy.question,
    promo: `${promo?.text ?? adCopy.promo.what} por ${formatAdPrice(promo?.price ?? adCopy.promo.price)}`,
    zona: zonePhrase(extra.nearby, lead.giro),
    negocio,
    colonia: lead.colonia ? formatBusinessName(lead.colonia) : zone?.label ?? lead.municipio,
    municipio: zone?.label ?? lead.municipio,
    cercania: zone?.cercania ?? "del oriente, de Chimalhuacán",
    giro: copy.label.toLowerCase(),
    giro_plural: copy.plural,
    giro_linea: copy.linea,
    giro_beneficio: copy.beneficio,
    giro_pregunta: copy.pregunta,
    link: extra.link,
    firma: extra.firma,
    // Whoever signs: each team member introduces themselves by name.
    nombre: senderFromSignature(extra.firma)?.firstName ?? extra.firma.split(/[·|,]/)[0].trim().split(" ")[0],
    // A business prospecting with Tlaco names itself and its offer.
    espacio: extra.espacio ?? "Tlaco",
    oferta: extra.oferta ?? "",
  };
}
