/** wa.me wants the number without "+"; Mexican mobiles keep the 52 prefix. */
export function buildWaLink(phoneE164: string, text?: string): string {
  const digits = phoneE164.replace(/\D/g, "");
  return text ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : `https://wa.me/${digits}`;
}

export function buildMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Opens the business's own Maps listing, where the phone is often more current than DENUE's. */
export function buildMapsSearchLink(lead: { business_name: string; address: string | null; colonia: string | null; municipio: string }): string {
  const query = [lead.business_name, lead.address, lead.colonia, lead.municipio, "Estado de México"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
