export interface ZoneCopy {
  /** Municipio exactly as DENUE writes it (stored in growth_leads.municipio). */
  municipio: string;
  slug: string;
  label: string;
  cercania: string;
}

export const ZONES: ZoneCopy[] = [
  { municipio: "Chimalhuacán", slug: "chim", label: "Chimalhuacán", cercania: "vecino de aquí de Chimalhuacán" },
  { municipio: "Nezahualcóyotl", slug: "neza", label: "Neza", cercania: "de Chimalhuacán, aquí cerca de Neza" },
  { municipio: "Ixtapaluca", slug: "ixta", label: "Ixtapaluca", cercania: "de Chimalhuacán, aquí cerca de Ixtapaluca" },
  { municipio: "Ecatepec de Morelos", slug: "ecat", label: "Ecatepec", cercania: "del oriente, de Chimalhuacán" },
];

export function zoneByMunicipio(municipio: string): ZoneCopy | undefined {
  return ZONES.find((zone) => zone.municipio === municipio);
}

export function zoneBySlug(slug: string): ZoneCopy | undefined {
  return ZONES.find((zone) => zone.slug === slug);
}
