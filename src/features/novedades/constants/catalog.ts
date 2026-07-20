import { FileText, Bike } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  FacturacionMockup,
  DomicilioMockup,
} from "@/features/novedades/components/mockups";

/**
 * Catálogo de novedades ("lo que viene"). Vive en código (no en DB) para poder
 * agregar/editar novedades sin migración. `key` es la que se guarda en
 * feature_interest cuando el negocio pulsa "Me interesa".
 *
 * `status`:
 *  - "upcoming": aún no disponible → muestra "Me interesa".
 *  - "new": recién liberada → muestra CTA a la feature (href).
 */
export type NovedadStatus = "upcoming" | "new";

export interface Novedad {
  key: string;
  status: NovedadStatus;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Beneficio corto (bullet destacado). */
  highlight: string;
  /** Preview visual de la feature (mockup al estilo de la landing). */
  Mockup: () => React.JSX.Element;
  /** Solo si status === "new": a dónde lleva. */
  href?: string;
}

export const NOVEDADES: Novedad[] = [
  {
    key: "facturacion",
    status: "upcoming",
    icon: FileText,
    title: "Facturación al SAT, sin complicarte",
    description:
      "Emite facturas desde aquí en segundos y cumple con el SAT sin saber de impuestos. Te ayudamos a darte de alta y, si quieres, un contador presenta tus declaraciones por ti.",
    highlight: "Véndele también a quien te pide factura",
    Mockup: FacturacionMockup,
  },
  {
    key: "domicilio",
    status: "upcoming",
    icon: Bike,
    title: "Entrega a domicilio por zonas",
    description:
      "Activa el envío a domicilio y recibe pedidos de tus clientes. Coordinamos la entrega por zonas para que llegue rápido — tú solo preparas el pedido.",
    highlight: "Llega más lejos sin contratar repartidores",
    Mockup: DomicilioMockup,
  },
];
