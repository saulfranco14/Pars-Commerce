export interface LandingPlan {
  code: "free" | "operation" | "growth" | "scale";
  name: string;
  price: number;
  eyebrow: string;
  description: string;
  featured?: boolean;
  features: string[];
}

export const LANDING_PLANS: LandingPlan[] = [
  {
    code: "free",
    name: "Gratis",
    price: 0,
    eyebrow: "Para empezar",
    description: "Vende, cobra y conoce Tlaco sin costo fijo.",
    features: [
      "Hasta 5 mesas activas",
      "Catálogo, QR, sitio web y órdenes",
      "Equipo ilimitado",
      "Clientes y préstamos manuales",
    ],
  },
  {
    code: "operation",
    name: "Operación",
    price: 199,
    eyebrow: "Más elegido",
    featured: true,
    description: "Cuando el negocio ya necesita atender más rápido.",
    features: [
      "Hasta 20 mesas activas",
      "1 kiosko para tomar pedidos",
      "Monto recomendado antes de prestar",
      "Todo lo incluido en Gratis",
    ],
  },
  {
    code: "growth",
    name: "Crecimiento",
    price: 399,
    eyebrow: "Más control",
    description: "Para supervisar varias operaciones con claridad.",
    features: [
      "Hasta 50 mesas y 3 kioskos",
      "Reportes y exportaciones",
      "Vista consolidada de 3 negocios",
      "Resumen semanal por correo",
    ],
  },
  {
    code: "scale",
    name: "Escala",
    price: 699,
    eyebrow: "Para expandirte",
    description: "Para una red de negocios que necesita control.",
    features: [
      "Hasta 100 mesas y 10 kioskos",
      "Vista consolidada de 10 negocios",
      "Reglas de crédito siempre manuales",
      "Reportes diarios o semanales",
    ],
  },
];
