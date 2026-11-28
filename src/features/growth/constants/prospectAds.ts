import type { AdField, AdFieldSpec, AdKind, GiroAdCopy } from "@/features/growth/interfaces/prospectAds";

export const AD_KINDS: AdKind[] = ["giro", "name", "promo", "prod"];

/** Instagram/WhatsApp Estado portrait. */
export const AD_WIDTH = 1080;
export const AD_HEIGHT = 1350;

export const AD_KIND_LABEL: Record<AdKind, string> = {
  giro: "Su giro",
  name: "Su negocio",
  promo: "Promoción",
  prod: "Producto",
};

export const AD_MARK_TEXT = "Muestra gratis · Tlaco";
export const AD_GENERIC_NAME = "Este es mi negocio";

const TEXT: AdFieldSpec = { field: "text", label: "Texto", maxLength: 32, numeric: false };
const PRICE: AdFieldSpec = { field: "price", label: "Precio", maxLength: 6, numeric: true };
const PLACE: AdFieldSpec = { field: "place", label: "Su dirección", maxLength: 48, numeric: false };

/** Ads with a price edit it; the text-only ones edit the address line instead. */
export const AD_FIELDS: Record<AdKind, [AdFieldSpec, AdFieldSpec]> = {
  giro: [TEXT, PLACE],
  name: [TEXT, PLACE],
  promo: [TEXT, PRICE],
  prod: [TEXT, PRICE],
};

export const AD_FIELD_MAX: Record<AdField, number> = { text: TEXT.maxLength, price: PRICE.maxLength, place: PLACE.maxLength };

/** Backgrounds the AI makes per giro and kind in one press of «Generar». */
export const AD_BACKGROUND_BATCH = 4;
export const AD_BACKGROUND_BUCKET = "growth-ads";

const PHOTO_RULES =
  "Realistic photo, natural warm light, shallow depth of field, vertical 4:5 framing. Keep the subject in the upper half and to the right; the lower half must be calm and out of focus, because large text goes there. No people, no faces, no hands, no text, no letters, no numbers, no logos, no brand names, no signs, no watermarks.";

function scene(place: string): string {
  return `Inside a small, clean, modest neighborhood ${place} in the State of Mexico. ${PHOTO_RULES}`;
}

function product(item: string): string {
  return `Close-up product photo of ${item}, on a simple wooden or tiled counter of a small Mexican neighborhood shop. ${PHOTO_RULES}`;
}

/** Keys match growth giros (DENUE), like GIRO_COPY. Prices are examples the owner corrects. */
export const GIRO_AD_COPY: Record<string, GiroAdCopy> = {
  cafeteria: {
    icon: "coffee",
    giroLine: "Café calientito todo el día",
    promo: { what: "2 cafés", price: "40", when: "Solo este fin de semana" },
    product: { name: "Café de olla", price: "25" },
    question: "¿A cómo da el café de olla?",
    slowIdea: "Si de 4 a 6 de la tarde vende poco, pruebe 2 cafés por $40 en ese horario.",
    scenePrompt: scene("coffee shop: a counter with a clay pot of café de olla, clay mugs and sweet bread in a glass case"),
    productPrompt: product("a clay mug of steaming Mexican café de olla with a cinnamon stick"),
  },
  panaderia: {
    icon: "croissant",
    giroLine: "Pan recién horneado, mañana y tarde",
    promo: { what: "10 piezas", price: "60", when: "De 6 a 8 de la noche" },
    product: { name: "Concha", price: "9" },
    question: "¿A cómo da la concha?",
    slowIdea: "Si al mediodía le sobra pan, pruebe 10 piezas por $60 de 12 a 2.",
    scenePrompt: scene("bakery: wooden trays full of Mexican sweet bread, conchas and bolillos, behind glass"),
    productPrompt: product("three Mexican conchas, vanilla and chocolate, on a metal bakery tray"),
  },
  taqueria: {
    icon: "flame",
    giroLine: "Tacos al pastor desde temprano",
    promo: { what: "5 tacos + refresco", price: "85", when: "Martes y miércoles" },
    product: { name: "Taco al pastor", price: "15" },
    question: "¿A cómo da el taco al pastor?",
    slowIdea: "Si martes y miércoles son flojos, pruebe 5 tacos con refresco esos días.",
    scenePrompt: scene("taco stand: a vertical al pastor spit with pineapple, a comal and salsas in clay bowls"),
    productPrompt: product("three tacos al pastor with pineapple, onion and cilantro on a plate, lime wedges"),
  },
  tienda: {
    icon: "basket",
    giroLine: "Todo para su despensa, cerca de casa",
    promo: { what: "Refresco 2 L + papas", price: "55", when: "Toda la semana" },
    product: { name: "Garrafón 20 L", price: "30" },
    question: "¿A cómo da el garrafón?",
    slowIdea: "Pruebe una semana recibir pedidos por WhatsApp con entrega en la cuadra.",
    scenePrompt: scene("corner grocery store (tienda de abarrotes): shelves with unbranded jars, rice, beans, eggs and fruit baskets"),
    productPrompt: product("a blue 20 liter water jug without any label or brand"),
  },
  materiales: {
    icon: "hammer",
    giroLine: "Material y herramienta para su obra",
    promo: { what: "Pintura 4 L + brocha", price: "380", when: "Todo este mes" },
    product: { name: "Bulto de cemento", price: "260" },
    question: "¿A cómo da el bulto de cemento?",
    slowIdea: "Pruebe mandar cotizaciones por WhatsApp el mismo día y cuente cuántas se cierran.",
    scenePrompt: scene("hardware store (ferretería): organized shelves of tools, screws, paint cans without labels"),
    productPrompt: product("a plain grey 50 kg cement bag without any printed brand, next to a trowel"),
  },
  ropa: {
    icon: "shirt",
    giroLine: "Ropa para toda la familia",
    promo: { what: "2 playeras", price: "250", when: "Solo este fin de semana" },
    product: { name: "Pantalón de mezclilla", price: "350" },
    question: "¿A cómo da el pantalón de mezclilla?",
    slowIdea: "Pruebe apartar prendas con anticipo por WhatsApp entre semana.",
    scenePrompt: scene("clothing boutique: colorful folded shirts on shelves and a rack of jeans"),
    productPrompt: product("a neatly folded pair of blue jeans and a white t-shirt without labels"),
  },
  "deposito-cerveza": {
    icon: "beer",
    giroLine: "Bien frías, a la vuelta de su casa",
    promo: { what: "Cartón de 12 + hielo", price: "280", when: "Viernes y sábado" },
    product: { name: "Six de lata", price: "120" },
    question: "¿A cómo da el six de lata?",
    slowIdea: "Pruebe avisar en su Estado cuando llega el hielo y cuente cuántos le escriben.",
    scenePrompt: scene("beverage depot: a glass-door fridge full of unbranded cold bottles and bags of ice"),
    productPrompt: product("six cold aluminum cans with water drops, completely plain without labels, on ice"),
  },
  tenis: {
    icon: "footprints",
    giroLine: "Calzado para toda la familia",
    promo: { what: "2 pares", price: "899", when: "Este fin de semana" },
    product: { name: "Tenis escolar", price: "450" },
    question: "¿A cómo da el tenis escolar?",
    slowIdea: "Pruebe apartar pares con anticipo por WhatsApp antes del regreso a clases.",
    scenePrompt: scene("shoe store: walls of shoe boxes and sneakers on display shelves"),
    productPrompt: product("a pair of plain white school sneakers without any logo"),
  },
  mascotas: {
    icon: "paw",
    giroLine: "Todo para su mascota",
    promo: { what: "Croquetas 4 kg + premios", price: "299", when: "Toda la semana" },
    product: { name: "Croquetas 2 kg", price: "160" },
    question: "¿A cómo da las croquetas de 2 kilos?",
    slowIdea: "Pruebe recordar por WhatsApp a sus clientes cuando se les acaba el alimento.",
    scenePrompt: scene("pet supply store: shelves with plain pet food bags, toys and leashes"),
    productPrompt: product("a plain unbranded bag of dog kibble with some kibble spilled in a bowl"),
  },
  veterinaria: {
    icon: "stethoscope",
    giroLine: "Consulta y cuidado para su mascota",
    promo: { what: "Baño + corte de uñas", price: "250", when: "Lunes a jueves" },
    product: { name: "Consulta general", price: "200" },
    question: "¿A cómo da la consulta?",
    slowIdea: "Pruebe agendar por WhatsApp las vacunas del mes y cuente cuántas citas salen.",
    scenePrompt: scene("veterinary clinic: a clean examination table, shelves with unlabeled medicine bottles"),
    productPrompt: product("a stethoscope, a dog collar and a small plush toy on a clean clinic table"),
  },
  autolavado: {
    icon: "car",
    giroLine: "Su auto limpio en 30 minutos",
    promo: { what: "Lavado + aspirado", price: "120", when: "Lunes a jueves" },
    product: { name: "Lavado exterior", price: "80" },
    question: "¿A cómo da el lavado?",
    slowIdea: "Pruebe vender 4 lavados al mes por adelantado y cuente cuántos clientes regresan.",
    scenePrompt: scene("car wash bay: soap foam, a pressure washer and microfiber cloths, wet floor"),
    productPrompt: product("a shiny clean car door with water drops and soap foam, no logo visible"),
  },
};

export const FALLBACK_AD_COPY: GiroAdCopy = {
  icon: "store",
  giroLine: "Lo que necesita, cerca de casa",
  promo: { what: "Promoción de la semana", price: "99", when: "Toda la semana" },
  product: { name: "Producto estrella", price: "50" },
  question: "¿A cómo da su producto estrella?",
  slowIdea: "Pruebe una promoción en su hora más floja durante una semana.",
  scenePrompt: scene("small shop with tidy shelves"),
  productPrompt: product("a neatly wrapped gift box without labels"),
};

export function giroAdCopy(giro: string): GiroAdCopy {
  return GIRO_AD_COPY[giro] ?? FALLBACK_AD_COPY;
}

/** The first idea of every zone report: being findable where customers already are. */
export const ZONE_FIRST_IDEA = {
  title: "Que lo encuentren por WhatsApp",
  action: "Suba su anuncio a su Estado 3 días seguidos.",
  test: "Prueba: cuente cuántos le escriben esos días contra la semana pasada.",
};
