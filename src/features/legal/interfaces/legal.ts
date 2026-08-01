export interface LegalSection {
  /** Ancla para enlazar directo a la cláusula desde soporte o correos. */
  id: string;
  title: string;
  /** Párrafos del cuerpo. Se renderizan en orden. */
  body?: string[];
  /** Viñetas. Van después de los párrafos. */
  list?: string[];
}

export interface LegalDoc {
  title: string;
  /** Bajada corta bajo el título. */
  summary: string;
  /** Fecha de última actualización en formato legible (es-MX). */
  updatedAt: string;
  sections: LegalSection[];
}
