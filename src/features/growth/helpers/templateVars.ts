import { giroCopy } from "@/features/growth/constants/giroCopy";
import { zoneByMunicipio } from "@/features/growth/constants/zoneCopy";

import type { TemplateVars } from "@/features/growth/interfaces/template";

const GENERIC_NAME = /^(miscel[aá]nea|abarrotes|tienda|tienda de abarrotes|sin nombre|ninguno|n\/?a|s\/?n|taquer[ií]a|tacos|ferreter[ií]a|tlapaler[ií]a|panader[ií]a|cafeter[ií]a|est[eé]tica|veterinaria|autolavado|lavado de autos|boutique|ropa|zapater[ií]a|dep[oó]sito)$/i;

export function isGenericBusinessName(name: string): boolean {
  return GENERIC_NAME.test(name.trim());
}

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

export function buildTemplateVars(lead: LeadForVars, extra: { link: string; firma: string; now?: Date }): TemplateVars {
  const copy = giroCopy(lead.giro);
  const zone = zoneByMunicipio(lead.municipio);
  const street = lead.address?.trim();
  const negocio = isGenericBusinessName(lead.business_name) && street
    ? `${copy.label.toLowerCase()} de ${street}`
    : lead.business_name;

  return {
    saludo: greetingFor(mexicoHour(extra.now ?? new Date())),
    negocio,
    colonia: lead.colonia ?? zone?.label ?? lead.municipio,
    municipio: zone?.label ?? lead.municipio,
    cercania: zone?.cercania ?? "del oriente, de Chimalhuacán",
    giro: copy.label.toLowerCase(),
    giro_plural: copy.plural,
    giro_linea: copy.linea,
    giro_beneficio: copy.beneficio,
    giro_pregunta: copy.pregunta,
    link: extra.link,
    firma: extra.firma,
  };
}
