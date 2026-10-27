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

export const PRIMARY_STARTER_CATALOGS: CatalogDefinition[] = [
  { key: "tienda", version: 4, businessType: "tienda", name: "Tienda de abarrotes", description: `${groceryProducts.length} productos de tienda real con precios de referencia y 4 servicios.`, products: groceryProducts, services: groceryServices },
  { key: "ropa", version: 3, businessType: "boutique", name: "Boutique y ecommerce", description: "18 prendas y accesorios con 5 servicios de atención.", products: boutiqueProducts, services: boutiqueServices },
  { key: "autolavado", version: 3, businessType: "lavado_autos", name: "Autolavado", description: "6 productos de cuidado y 10 servicios listos para operar.", products: carwashProducts, services: carwashServices },
];
