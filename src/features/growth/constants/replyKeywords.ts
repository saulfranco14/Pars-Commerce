/** Any of these in a reply means "do not contact again", however it is phrased. */
export const REJECTION_PATTERNS: RegExp[] = [
  /\bno\s+(me\s+)?interesa/i,
  /\bno\s+gracias\b/i,
  /\bya\s+no\s+(me\s+)?(escrib|mand|molest|contact)/i,
  /\bdeja(n)?\s+de\s+(escribir|mandar|molestar)/i,
  /\bno\s+(me\s+)?(vuelva|vuelvan)\s+a\s+(escribir|mandar|contactar)/i,
  /\bdar(me)?\s+de\s+baja\b|\b(unsubscribe|stop)\b/i,
  /\b(spam|fraude|estafa)\b/i,
  /\bch[ia]nga|pendej|verga|mam[oó]n|c[aá]brón|est[eé]n\s+chingando/i,
];

export const BOUNCE_SENDER = /mailer-daemon|postmaster/i;
export const BOUNCE_SUBJECT = /(undeliver|delivery status|failure notice|no se pudo entregar|returned mail|address not found)/i;
export const AUTO_REPLY_SUBJECT = /(fuera de la oficina|out of office|respuesta autom[aá]tica|auto(matic)?[- ]?reply|vacaciones)/i;
