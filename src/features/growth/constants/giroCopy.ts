export interface GiroCopy {
  label: string;
  plural: string;
  linea: string;
  beneficio: string;
  pregunta: string;
  /** Headline of the sample store in the «Para ti» preview, written for the business's customers. */
  titular: string;
}

/** Keys match DENUE giros and STARTER_CATALOGS keys, so the giro is also the catalog key. */
export const GIRO_COPY: Record<string, GiroCopy> = {
  tienda: {
    label: "Abarrotes",
    plural: "tienditas",
    linea: "productos de abarrotes",
    beneficio: "que tus clientes te pidan desde su celular y pasen por su pedido ya pagado",
    pregunta: "¿cómo te hacen hoy los pedidos tus clientes?",
    titular: "Pide lo de todos los días y pasa por él.",
  },
  materiales: {
    label: "Ferretería",
    plural: "ferreterías",
    linea: "productos de ferretería y tlapalería",
    beneficio: "mandar cotizaciones por link y cobrar desde el celular",
    pregunta: "¿cómo le mandas hoy la cotización a tus clientes?",
    titular: "Pide tu material y te lo llevamos a la obra.",
  },
  ropa: {
    label: "Ropa",
    plural: "tiendas de ropa",
    linea: "ropa de ejemplo con tallas y precios",
    beneficio: "que tus clientes aparten con un anticipo desde su celular",
    pregunta: "¿cómo te apartan hoy una prenda tus clientes?",
    titular: "Aparta tu prenda desde el celular.",
  },
  taqueria: {
    label: "Taquería",
    plural: "taquerías",
    linea: "un menú de ejemplo de tacos y tortas",
    beneficio: "que te pidan desde la mesa con un QR y paguen cuando su orden ya está lista",
    pregunta: "¿cómo te piden hoy en las mesas cuando hay mucha gente?",
    titular: "Pide tus tacos sin hacer fila.",
  },
  cafeteria: {
    label: "Cafetería",
    plural: "cafeterías",
    linea: "productos de ejemplo de cafetería",
    beneficio: "que te pidan desde la mesa con un QR y paguen cuando su pedido ya está listo",
    pregunta: "¿cómo te piden hoy en las mesas cuando hay mucha gente?",
    titular: "Pide tu café y pasa por él.",
  },
  panaderia: {
    label: "Panadería",
    plural: "panaderías",
    linea: "pan de ejemplo con precios",
    beneficio: "que tus clientes aparten su pan y pasen por él ya pagado",
    pregunta: "¿cómo te encargan hoy pasteles o pedidos grandes?",
    titular: "Aparta tu pan y pasa por él.",
  },
  "deposito-cerveza": {
    label: "Depósito",
    plural: "depósitos",
    linea: "productos de ejemplo de depósito",
    beneficio: "que tus clientes te pidan por celular y pasen por su pedido ya pagado",
    pregunta: "¿cómo te hacen hoy los pedidos por WhatsApp?",
    titular: "Pide tus bebidas frías y pasa por ellas.",
  },
  tenis: {
    label: "Calzado",
    plural: "zapaterías",
    linea: "calzado de ejemplo con tallas y precios",
    beneficio: "que tus clientes aparten su par con un anticipo desde su celular",
    pregunta: "¿cómo te apartan hoy un par tus clientes?",
    titular: "Encuentra tu par y apártalo.",
  },
  mascotas: {
    label: "Mascotas",
    plural: "tiendas de mascotas",
    linea: "productos de ejemplo para mascotas",
    beneficio: "que tus clientes te pidan su alimento por celular y pasen por él ya pagado",
    pregunta: "¿cómo te encargan hoy el alimento tus clientes?",
    titular: "Todo para tu mascota, sin salir de casa.",
  },
  veterinaria: {
    label: "Veterinaria",
    plural: "veterinarias",
    linea: "servicios de ejemplo de veterinaria",
    beneficio: "que tus clientes agenden y paguen consultas desde su celular",
    pregunta: "¿cómo te agendan hoy las consultas?",
    titular: "Agenda la consulta de tu mascota.",
  },
  autolavado: {
    label: "Autolavado",
    plural: "autolavados",
    linea: "tus servicios de lavado",
    beneficio: "vender membresías de lavados al mes y cobrar cuando el auto ya está listo",
    pregunta: "¿cómo te pagan hoy tus clientes cuando recogen su auto?",
    titular: "Agenda el lavado de tu auto.",
  },
};

export const GIRO_KEYS = Object.keys(GIRO_COPY);

const FALLBACK_COPY: GiroCopy = {
  label: "Negocio",
  plural: "negocios",
  linea: "productos de ejemplo",
  beneficio: "que tus clientes te pidan y te paguen desde su celular",
  pregunta: "¿cómo te hacen hoy los pedidos tus clientes?",
  titular: "Elige, pide y recibe tu pedido.",
};

export function giroCopy(giro: string): GiroCopy {
  return GIRO_COPY[giro] ?? FALLBACK_COPY;
}
