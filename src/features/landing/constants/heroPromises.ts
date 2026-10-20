import { ShieldCheck, Smartphone, Store } from "lucide-react";

/** Lo que distingue a Tlaco, dicho en el hero. Cada una la cumple el producto hoy (ver FAQs). */
export const HERO_PROMISES = [
  { icon: Smartphone, text: "Tu cliente escanea con su cámara y pide sin descargar ninguna app" },
  { icon: ShieldCheck, text: "El pago se abre hasta que marcas el pedido como listo" },
  { icon: Store, text: "Eliges tu giro y tu catálogo de inicio ya viene armado" },
] as const;
