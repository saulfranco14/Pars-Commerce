import { GENERIC_CATALOG_IMAGE } from "@/features/catalog/constants/catalogImages";
import { groceryProducts } from "@/features/catalog/groceryStarterCatalog";

import type { CatalogDefinition, CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";

type ItemSeed = readonly [name: string, price: number, category: string, description: string];

function items(type: CatalogItemDefinition["type"], imagePrefix: string, seeds: readonly ItemSeed[]): CatalogItemDefinition[] {
  return seeds.map(([name, price, category, description], index) => ({
    name,
    price,
    type,
    category,
    description,
    imageUrl: `${imagePrefix}-${(index % 4) + 1}.webp`,
    imageAlt: `${name}, ${category.toLowerCase()}`,
  }));
}

/** Editorial prices and categories for giros that don't have their own photos yet. */
function itemsWithoutPhotos(type: CatalogItemDefinition["type"], seeds: readonly ItemSeed[]): CatalogItemDefinition[] {
  return seeds.map(([name, price, category, description]) => ({
    name,
    price,
    type,
    category,
    description,
    imageUrl: GENERIC_CATALOG_IMAGE,
    imageAlt: name,
  }));
}

const groceryServices = items("service", "/catalog/starter/abarrotes", [
  ["Recarga telefónica", 20, "Servicios", "Recarga desde veinte pesos a las principales compañías."],
  ["Pago de servicios", 12, "Servicios", "Recepción de pagos con comprobante."],
  ["Entrega local", 25, "Servicios", "Entrega en la colonia en horario disponible."],
  ["Pedido preparado", 15, "Servicios", "Armamos tu lista para recoger sin filas."],
] as const);

const boutiqueProducts = items("product", "/catalog/starter/boutique", [
  ["Blusa lino arena", 389, "Blusas", "Blusa ligera de corte relajado."],
  ["Blusa satinada noche", 449, "Blusas", "Blusa satinada para un look elegante."],
  ["Top tejido marfil", 329, "Blusas", "Top tejido de cuello redondo."],
  ["Camisa oversized blanca", 469, "Blusas", "Camisa amplia de algodón suave."],
  ["Jeans rectos índigo", 649, "Pantalones", "Mezclilla de tiro alto y pierna recta."],
  ["Pantalón sastre negro", 699, "Pantalones", "Pantalón de vestir con pinzas."],
  ["Pantalón wide leg olivo", 629, "Pantalones", "Pantalón amplio de caída fluida."],
  ["Falda midi cacao", 519, "Faldas", "Falda midi con cintura definida."],
  ["Vestido midi terracota", 849, "Vestidos", "Vestido fluido para día o tarde."],
  ["Vestido camisero azul", 799, "Vestidos", "Vestido camisero con cinturón."],
  ["Vestido negro esencial", 899, "Vestidos", "Vestido negro de silueta limpia."],
  ["Suéter ligero avena", 579, "Capas", "Tejido suave para clima fresco."],
  ["Chamarra corta mezclilla", 879, "Capas", "Chamarra de mezclilla lavada."],
  ["Bolsa estructurada miel", 749, "Accesorios", "Bolsa compacta con correa ajustable."],
  ["Cinturón piel vegana", 289, "Accesorios", "Cinturón café con hebilla dorada."],
  ["Aretes aro dorado", 219, "Accesorios", "Aros ligeros de acabado mate."],
  ["Collar punto de luz", 249, "Accesorios", "Cadena fina con dije discreto."],
  ["Pañuelo estampado", 199, "Accesorios", "Pañuelo satinado para distintos estilos."],
] as const);

const boutiqueServices = items("service", "/catalog/starter/boutique", [
  ["Apartado de prenda", 100, "Atención", "Reserva tu prenda y completa el pago después."],
  ["Ajuste básico", 120, "Atención", "Ajuste sencillo de largo o cintura."],
  ["Asesoría de estilo", 250, "Atención", "Sesión personal de combinación y tallas."],
  ["Envoltura para regalo", 45, "Atención", "Empaque cuidado con tarjeta de dedicatoria."],
  ["Entrega local", 69, "Atención", "Entrega programada dentro de la zona."],
] as const);

const carwashProducts = items("product", "/catalog/starter/autolavado", [
  ["Aromatizante cítrico", 79, "Cuidado", "Aroma fresco de larga duración."],
  ["Paño de microfibra", 69, "Cuidado", "Microfibra suave para interiores y pintura."],
  ["Shampoo neutro 500 ml", 139, "Cuidado", "Limpieza segura para la carrocería."],
  ["Cera líquida 500 ml", 189, "Cuidado", "Brillo y protección de aplicación rápida."],
  ["Protector de tablero", 159, "Cuidado", "Acabado mate con protección UV."],
  ["Kit limpieza interior", 329, "Cuidado", "Limpiador, microfibra y aplicador."],
] as const);

const carwashServices = items("service", "/catalog/starter/autolavado", [
  ["Lavado exterior", 120, "Lavado", "Espuma, enjuague y secado manual."],
  ["Lavado completo", 190, "Lavado", "Exterior, aspirado y limpieza de tablero."],
  ["Aspirado interior", 90, "Interior", "Aspirado de asientos, piso y cajuela."],
  ["Lavado de motor", 260, "Especialidad", "Desengrasado y limpieza controlada."],
  ["Encerado express", 280, "Protección", "Cera líquida y brillo de carrocería."],
  ["Pulido de faros", 390, "Especialidad", "Recuperación de claridad en dos faros."],
  ["Detallado interior", 690, "Interior", "Limpieza profunda de superficies y rincones."],
  ["Lavado de vestiduras", 850, "Interior", "Inyección y extracción en asientos de tela."],
  ["Sanitización de cabina", 240, "Interior", "Tratamiento de cabina y ventilación."],
  ["Servicio a domicilio", 350, "A domicilio", "Lavado completo en la ubicación indicada."],
] as const);

const hardwareProducts = itemsWithoutPhotos("product", [
  ["Cemento 50 kg", 265, "Obra negra", "Bulto de cemento gris para obra y aplanados."],
  ["Block hueco", 14, "Obra negra", "Block de concreto de 12 × 20 × 40 cm, por pieza."],
  ["Varilla 3/8", 145, "Obra negra", "Varilla corrugada de 12 m."],
  ["Arena por bulto", 55, "Obra negra", "Bulto de arena cernida para mezcla."],
  ["Grava por bulto", 60, "Obra negra", "Bulto de grava de 3/4 para colados."],
  ["Pintura vinílica", 420, "Pintura", "Galón de 4 L para interiores y exteriores."],
  ["Brocha 4 pulgadas", 65, "Pintura", "Brocha de cerda natural para esmalte y vinílica."],
  ["Rodillo", 95, "Pintura", "Rodillo de 9 pulgadas con maneral."],
  ["Impermeabilizante", 1150, "Pintura", "Cubeta de 19 L, rendimiento de 3 años."],
  ["Cinta métrica", 85, "Herramienta", "Flexómetro de 5 m con freno."],
  ["Martillo", 160, "Herramienta", "Martillo de uña de 16 oz con mango de fibra."],
  ["Taladro inalámbrico", 1290, "Herramienta", "Taladro de 12 V con batería y cargador."],
  ["Escalera aluminio", 1450, "Herramienta", "Escalera de tijera de 5 peldaños."],
  ["Clavos 1 kg", 45, "Tornillería", "Clavo estándar de 2 1/2 pulgadas."],
  ["Tornillos 100 pzas", 70, "Tornillería", "Pija para madera y taquete de 1 1/2 pulgadas."],
] as const);

const hardwareServices = itemsWithoutPhotos("service", [
  ["Flete local", 150, "Servicios", "Entrega de material en la zona."],
  ["Descarga de material", 100, "Servicios", "Bajamos el material al pie de la obra."],
  ["Corte de varilla", 10, "Servicios", "Corte a la medida, por pieza."],
  ["Cotización de obra", 0, "Servicios", "Mándanos tu lista y te cotizamos sin costo."],
  ["Pedido por obra", 0, "Servicios", "Apartamos el material de tu obra por etapas."],
  ["Entrega programada", 180, "Servicios", "Entrega en el día y horario que elijas."],
  ["Asesoría de materiales", 0, "Servicios", "Te ayudamos a calcular cuánto material necesitas."],
  ["Carga pesada", 350, "Servicios", "Flete para varilla, block o más de 20 bultos."],
  ["Mezcla de pintura", 40, "Servicios", "Igualación de color por galón."],
  ["Reserva de material", 0, "Servicios", "Te guardamos el material hasta 3 días."],
] as const);

const taqueriaProducts = itemsWithoutPhotos("product", [
  ["Taco al pastor", 18, "Tacos", "Con cebolla, cilantro y piña."],
  ["Taco de bistec", 22, "Tacos", "Bistec de res a la plancha."],
  ["Taco de suadero", 20, "Tacos", "Suadero dorado con cebolla y cilantro."],
  ["Taco de pollo", 18, "Tacos", "Pollo adobado a la plancha."],
  ["Gringa", 55, "Especialidades", "Tortilla de harina con queso y pastor."],
  ["Quesadilla", 35, "Especialidades", "Tortilla de harina con queso y el guisado que elijas."],
  ["Orden de pastor", 85, "Especialidades", "Cinco tacos al pastor con su piña."],
  ["Volcán", 30, "Especialidades", "Tostada con queso gratinado y carne."],
  ["Paquete familiar", 320, "Especialidades", "Veinte tacos surtidos, cebollitas y salsas."],
  ["Refresco", 25, "Bebidas", "Refresco de 600 ml."],
  ["Agua fresca", 25, "Bebidas", "Vaso de medio litro, sabor del día."],
  ["Horchata", 25, "Bebidas", "Vaso de medio litro."],
  ["Papas preparadas", 45, "Complementos", "Papas a la francesa con salsa y limón."],
  ["Frijoles charros", 40, "Complementos", "Vaso de frijoles charros con chicharrón."],
  ["Postre del día", 35, "Complementos", "Pregunta por el postre de hoy."],
] as const);

const taqueriaServices = itemsWithoutPhotos("service", [
  ["Taquiza para 20 personas", 2400, "Eventos", "Tres guisados, tortillas, salsas y taquero."],
  ["Taquiza para 50 personas", 5500, "Eventos", "Cinco guisados, tortillas, salsas y dos taqueros."],
  ["Charola de tacos", 450, "Eventos", "Treinta tacos surtidos para llevar."],
  ["Catering", 3500, "Eventos", "Servicio completo para tu reunión."],
  ["Entrega local", 30, "Eventos", "Entrega en la colonia."],
  ["Pedido para oficina", 500, "Eventos", "Paquete de tacos y bebidas para tu equipo."],
  ["Servicio nocturno", 50, "Eventos", "Cargo por entrega después de las 11 pm."],
  ["Barra de salsas", 350, "Eventos", "Seis salsas y complementos para tu evento."],
  ["Evento empresarial", 8000, "Eventos", "Taquiza para cien personas con montaje."],
  ["Reserva de mesa", 0, "Eventos", "Apartamos tu mesa sin costo."],
] as const);

export const PRIMARY_STARTER_CATALOGS: CatalogDefinition[] = [
  { key: "tienda", version: 4, businessType: "tienda", name: "Tienda de abarrotes", description: `${groceryProducts.length} productos de tienda real con precios de referencia y 4 servicios.`, products: groceryProducts, services: groceryServices },
  { key: "ropa", version: 3, businessType: "boutique", name: "Boutique y ecommerce", description: "18 prendas y accesorios con 5 servicios de atención.", products: boutiqueProducts, services: boutiqueServices },
  { key: "autolavado", version: 3, businessType: "lavado_autos", name: "Autolavado", description: "6 productos de cuidado y 10 servicios listos para operar.", products: carwashProducts, services: carwashServices },
  { key: "materiales", version: 2, businessType: "materiales", name: "Materiales de construcción", description: "Material para obra, herramienta y apoyo logístico.", products: hardwareProducts, services: hardwareServices },
  { key: "taqueria", version: 2, businessType: "taqueria", name: "Taquería", description: "Tacos, bebidas y servicios para eventos.", products: taqueriaProducts, services: taqueriaServices },
];
