export interface GiroCopy {
  label: string;
  plural: string;
  linea: string;
  beneficio: string;
  pregunta: string;
}

/** Keys match DENUE giros and STARTER_CATALOGS keys, so the giro is also the catalog key. */
export const GIRO_COPY: Record<string, GiroCopy> = {
  tienda: {
    label: "Abarrotes",
    plural: "tienditas",
    linea: "productos de abarrotes",
    beneficio: "que tus clientes te pidan desde su celular y pasen por su pedido ya pagado",
    pregunta: "¿cómo te hacen hoy los pedidos tus clientes?",
  },
  materiales: {
    label: "Ferretería",
    plural: "ferreterías",
    linea: "productos de ferretería y tlapalería",
    beneficio: "mandar cotizaciones por link y cobrar desde el celular",
    pregunta: "¿cómo le mandas hoy la cotización a tus clientes?",
  },
  ropa: {
    label: "Ropa",
    plural: "tiendas de ropa",
    linea: "ropa de ejemplo con tallas y precios",
    beneficio: "que tus clientes aparten con un anticipo desde su celular",
    pregunta: "¿cómo te apartan hoy una prenda tus clientes?",
  },
  taqueria: {
    label: "Taquería",
    plural: "taquerías",
    linea: "un menú de ejemplo de tacos y tortas",
    beneficio: "que te pidan desde la mesa con un QR y paguen cuando su orden ya está lista",
    pregunta: "¿cómo te piden hoy en las mesas cuando hay mucha gente?",
  },
  cafeteria: {
    label: "Cafetería",
    plural: "cafeterías",
    linea: "productos de ejemplo de cafetería",
    beneficio: "que te pidan desde la mesa con un QR y paguen cuando su pedido ya está listo",
    pregunta: "¿cómo te piden hoy en las mesas cuando hay mucha gente?",
  },
  panaderia: {
    label: "Panadería",
    plural: "panaderías",
    linea: "pan de ejemplo con precios",
    beneficio: "que tus clientes aparten su pan y pasen por él ya pagado",
    pregunta: "¿cómo te encargan hoy pasteles o pedidos grandes?",
  },
  "deposito-cerveza": {
    label: "Depósito",
    plural: "depósitos",
    linea: "productos de ejemplo de depósito",
    beneficio: "que tus clientes te pidan por celular y pasen por su pedido ya pagado",
    pregunta: "¿cómo te hacen hoy los pedidos por WhatsApp?",
  },
  tenis: {
    label: "Calzado",
    plural: "zapaterías",
    linea: "calzado de ejemplo con tallas y precios",
    beneficio: "que tus clientes aparten su par con un anticipo desde su celular",
    pregunta: "¿cómo te apartan hoy un par tus clientes?",
  },
  mascotas: {
    label: "Mascotas",
    plural: "tiendas de mascotas",
    linea: "productos de ejemplo para mascotas",
    beneficio: "que tus clientes te pidan su alimento por celular y pasen por él ya pagado",
    pregunta: "¿cómo te encargan hoy el alimento tus clientes?",
  },
  veterinaria: {
    label: "Veterinaria",
    plural: "veterinarias",
    linea: "servicios de ejemplo de veterinaria",
    beneficio: "que tus clientes agenden y paguen consultas desde su celular",
    pregunta: "¿cómo te agendan hoy las consultas?",
  },
  autolavado: {
    label: "Autolavado",
    plural: "autolavados",
    linea: "tus servicios de lavado",
    beneficio: "vender membresías de lavados al mes y cobrar cuando el auto ya está listo",
    pregunta: "¿cómo te pagan hoy tus clientes cuando recogen su auto?",
  },
};

export const GIRO_KEYS = Object.keys(GIRO_COPY);

const FALLBACK_COPY: GiroCopy = {
  label: "Negocio",
  plural: "negocios",
  linea: "productos de ejemplo",
  beneficio: "que tus clientes te pidan y te paguen desde su celular",
  pregunta: "¿cómo te hacen hoy los pedidos tus clientes?",
};

export function giroCopy(giro: string): GiroCopy {
  return GIRO_COPY[giro] ?? FALLBACK_COPY;
}
