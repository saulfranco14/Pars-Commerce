import { UserPlus, Store, Zap } from "lucide-react";

export const STEPS = [
  {
    icon: UserPlus,
    step: 1,
    title: "Registrate",
    description: "Crea tu cuenta en segundos. Sin tarjeta para empezar.",
    detail: "30 segundos",
  },
  {
    icon: Store,
    step: 2,
    title: "Crea tu negocio",
    description: "Dale nombre, slug y tipo. Tu sitio estara listo al instante.",
    detail: "tutienda.pars.com",
  },
  {
    icon: Zap,
    step: 3,
    title: "Empieza a vender",
    description: "Agrega productos, configura promociones y comparte tu tienda.",
    detail: "Sin comision de plataforma",
  },
] as const;
