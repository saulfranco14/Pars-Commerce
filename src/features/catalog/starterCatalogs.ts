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

const bakeryProducts = itemsWithoutPhotos("product", [
  ["Bolillo", 4, "Pan blanco", "Recién horneado, por pieza."],
  ["Concha", 14, "Pan dulce", "De vainilla o chocolate."],
  ["Cuernito", 15, "Pan dulce", "Hojaldrado, por pieza."],
  ["Dona glaseada", 16, "Pan dulce", "Con glaseado de azúcar."],
  ["Pan de elote", 25, "Pan dulce", "Rebanada de pan de elote casero."],
  ["Rosca individual", 30, "Pan dulce", "Rosca pequeña con fruta cristalizada."],
  ["Baguette", 28, "Pan blanco", "Baguette de 40 cm."],
  ["Pastel de chocolate", 380, "Pasteles", "Para 12 personas."],
  ["Pastel tres leches", 360, "Pasteles", "Para 12 personas."],
  ["Galletas de mantequilla", 60, "Galletas", "Bolsa de 250 g."],
  ["Empanada de piña", 15, "Pan dulce", "Rellena de piña."],
  ["Café americano", 25, "Bebidas", "Vaso de 12 oz."],
  ["Chocolate caliente", 30, "Bebidas", "Vaso de 12 oz."],
  ["Leche fría", 20, "Bebidas", "Vaso de 355 ml."],
  ["Caja de pan surtido", 120, "Pan dulce", "Diez piezas surtidas."],
] as const);

const bakeryServices = itemsWithoutPhotos("service", [
  ["Pastel personalizado", 550, "Pedidos", "Pastel para 20 personas con el diseño que elijas."],
  ["Mesa de postres", 2500, "Pedidos", "Postres surtidos para 40 personas."],
  ["Pedido por volumen", 0, "Pedidos", "Cotizamos sin costo pedidos de más de 50 piezas."],
  ["Entrega local", 30, "Pedidos", "Entrega en la colonia."],
  ["Pan para evento", 400, "Pedidos", "Cien bolillos para tu evento."],
  ["Caja corporativa", 350, "Pedidos", "Pan dulce y café para diez personas."],
  ["Decoración de pastel", 120, "Pedidos", "Mensaje y decoración sencilla."],
  ["Pastel temático", 750, "Pedidos", "Pastel decorado con el tema de tu fiesta."],
  ["Reserva de producción", 0, "Pedidos", "Apartamos tu pedido con un día de anticipación."],
  ["Coffee break", 900, "Pedidos", "Pan, café y jugo para 15 personas."],
] as const);

const liquorProducts = itemsWithoutPhotos("product", [
  ["Cerveza clara lata", 22, "Cerveza", "Lata de 355 ml."],
  ["Cerveza oscura lata", 24, "Cerveza", "Lata de 355 ml."],
  ["Six pack", 125, "Cerveza", "Seis latas de 355 ml."],
  ["Cerveza artesanal", 65, "Cerveza", "Botella de 355 ml."],
  ["Refresco 2 L", 40, "Refrescos y agua", "Botella de 2 litros."],
  ["Agua mineral", 22, "Refrescos y agua", "Botella de 600 ml."],
  ["Hielo 5 kg", 40, "Hielo", "Bolsa de 5 kg."],
  ["Papas enchiladas", 22, "Botanas", "Bolsa de 45 g."],
  ["Cacahuates", 20, "Botanas", "Bolsa de 100 g."],
  ["Vaso desechable", 30, "Desechables", "Paquete de 25 vasos."],
  ["Michelada preparada", 75, "Cerveza", "Litro con chamoy, limón y sal."],
  ["Tequila 750 ml", 320, "Destilados", "Tequila blanco."],
  ["Whisky 750 ml", 450, "Destilados", "Whisky escocés."],
  ["Paquete fiesta", 650, "Cerveza", "24 cervezas, hielo y botana."],
  ["Bolsa de hielo", 25, "Hielo", "Bolsa de 3 kg."],
] as const);

const liquorServices = itemsWithoutPhotos("service", [
  ["Entrega local", 30, "Servicios", "Entrega en la colonia."],
  ["Enfriado express", 20, "Servicios", "Enfriamos tu cerveza en 10 minutos."],
  ["Paquete para fiesta", 0, "Servicios", "Armamos tu pedido de fiesta sin costo."],
  ["Préstamo de hielera", 50, "Servicios", "Hielera de 45 litros por un día."],
  ["Pedido para evento", 0, "Servicios", "Cotizamos tu evento sin costo."],
  ["Armado de micheladas", 300, "Servicios", "Barra de micheladas para 20 personas."],
  ["Entrega programada", 40, "Servicios", "Entrega en el día y horario que elijas."],
  ["Reserva de producto", 0, "Servicios", "Te apartamos tu pedido."],
  ["Cotización mayorista", 0, "Servicios", "Precio especial por caja."],
  ["Carga al auto", 0, "Servicios", "Te subimos el pedido a tu auto."],
] as const);

const cafeProducts = itemsWithoutPhotos("product", [
  ["Americano", 35, "Café", "Vaso de 12 oz."],
  ["Capuchino", 50, "Café", "Vaso de 12 oz."],
  ["Latte", 55, "Café", "Vaso de 12 oz."],
  ["Chai", 60, "Café", "Chai latte de 12 oz."],
  ["Té", 35, "Bebidas", "Té de hierbas o negro."],
  ["Chocolate caliente", 50, "Bebidas", "Vaso de 12 oz."],
  ["Croissant", 40, "Para comer", "Croissant de mantequilla."],
  ["Panini", 85, "Para comer", "Jamón, queso y pesto."],
  ["Bagel", 70, "Para comer", "Con queso crema."],
  ["Rebanada de pastel", 65, "Para comer", "Pastel del día."],
  ["Galleta", 30, "Para comer", "Galleta con chispas de chocolate."],
  ["Agua mineral", 25, "Bebidas", "Botella de 355 ml."],
  ["Jugo natural", 45, "Bebidas", "Naranja o verde, 12 oz."],
  ["Frappé", 65, "Bebidas", "Moka, vainilla o caramelo."],
  ["Combo desayuno", 110, "Para comer", "Americano y panini."],
] as const);

const cafeServices = itemsWithoutPhotos("service", [
  ["Coffee break", 1200, "Eventos", "Café, pan y jugo para 15 personas."],
  ["Catering", 3500, "Eventos", "Servicio para tu reunión de 30 personas."],
  ["Pedido para oficina", 600, "Eventos", "Diez cafés y pan dulce."],
  ["Reserva de mesa", 0, "Eventos", "Apartamos tu mesa sin costo."],
  ["Entrega local", 30, "Eventos", "Entrega en la colonia."],
  ["Barra de café", 2800, "Eventos", "Barista y café para 50 personas."],
  ["Evento privado", 4500, "Eventos", "El local para tu evento por tres horas."],
  ["Pedido programado", 0, "Eventos", "Tu pedido listo a la hora que elijas."],
  ["Paquete empresarial", 2000, "Eventos", "Café para tu equipo durante una semana."],
  ["Taller de café", 450, "Eventos", "Por persona, dos horas."],
] as const);

const sneakersProducts = itemsWithoutPhotos("product", [
  ["Tenis urbanos", 1199, "Tenis", "Del 23 al 29."],
  ["Tenis running", 1499, "Tenis", "Con amortiguación, del 23 al 29."],
  ["Tenis casual", 999, "Tenis", "Del 22 al 29."],
  ["Tenis infantil", 699, "Tenis", "Del 15 al 22."],
  ["Agujetas blancas", 60, "Accesorios", "Par de 120 cm."],
  ["Agujetas de color", 70, "Accesorios", "Par de 120 cm."],
  ["Plantillas confort", 180, "Accesorios", "Plantilla de gel recortable."],
  ["Protector impermeable", 220, "Cuidado", "Aerosol de 200 ml."],
  ["Kit de limpieza", 290, "Cuidado", "Limpiador, cepillo y microfibra."],
  ["Cepillo sneaker", 120, "Cuidado", "Cerda suave para suela y tela."],
  ["Calcetas deportivas", 150, "Accesorios", "Paquete de 3 pares."],
  ["Gorra deportiva", 350, "Accesorios", "Ajustable."],
  ["Mochila", 650, "Accesorios", "Mochila de 20 litros."],
  ["Sandalia", 450, "Tenis", "Del 23 al 29."],
  ["Tenis edición especial", 2499, "Tenis", "Modelo de colección, piezas limitadas."],
] as const);

const sneakersServices = itemsWithoutPhotos("service", [
  ["Limpieza básica", 150, "Servicios", "Suela y exterior, listos en 24 horas."],
  ["Limpieza profunda", 280, "Servicios", "Exterior, interior y agujetas."],
  ["Restauración", 550, "Servicios", "Repintado de suela y detalles."],
  ["Cambio de agujetas", 30, "Servicios", "Mano de obra; las agujetas van aparte."],
  ["Aplicación de protector", 90, "Servicios", "Protección contra agua y manchas."],
  ["Apartado", 0, "Servicios", "Aparta tu par con un anticipo."],
  ["Entrega local", 40, "Servicios", "Entrega en la colonia."],
  ["Reserva de talla", 0, "Servicios", "Te guardamos tu talla dos días."],
  ["Pedido especial", 0, "Servicios", "Conseguimos el modelo que buscas."],
  ["Autenticación visual", 150, "Servicios", "Revisión de originalidad."],
] as const);

const petsProducts = itemsWithoutPhotos("product", [
  ["Croquetas premium", 650, "Alimento", "Bulto de 7.5 kg."],
  ["Lata para perro", 45, "Alimento", "Lata de 375 g."],
  ["Lata para gato", 32, "Alimento", "Lata de 156 g."],
  ["Arena aglomerante", 180, "Higiene", "Bolsa de 10 kg."],
  ["Juguete de cuerda", 90, "Juguetes", "Para perro mediano."],
  ["Pelota resistente", 85, "Juguetes", "De hule, para morder."],
  ["Cama pequeña", 390, "Accesorios", "Para perro o gato pequeño."],
  ["Arnés", 280, "Accesorios", "Ajustable, tallas S a L."],
  ["Placa", 120, "Accesorios", "Placa de identificación."],
  ["Rascador", 450, "Accesorios", "Torre de 60 cm."],
  ["Cepillo", 110, "Higiene", "Para pelo corto o largo."],
  ["Bebedero", 160, "Accesorios", "Bebedero de un litro."],
  ["Premios naturales", 95, "Alimento", "Bolsa de 200 g."],
  ["Pañales", 220, "Higiene", "Paquete de 12."],
  ["Pasta dental", 120, "Higiene", "Con cepillo de dedo."],
] as const);

const petsServices = itemsWithoutPhotos("service", [
  ["Entrega local", 30, "Servicios", "Entrega en la colonia."],
  ["Paquete recurrente", 0, "Servicios", "Te recordamos cuando se acaba el alimento."],
  ["Grabado de placa", 60, "Servicios", "Nombre y teléfono."],
  ["Armado de kit", 0, "Servicios", "Armamos el kit para tu nueva mascota."],
  ["Pedido por suscripción", 0, "Servicios", "Tu alimento cada mes."],
  ["Asesoría de alimento", 0, "Servicios", "Te ayudamos a elegir su alimento."],
  ["Envoltura de regalo", 25, "Servicios", "Para regalar."],
  ["Reserva de producto", 0, "Servicios", "Te apartamos tu pedido."],
  ["Entrega programada", 40, "Servicios", "Entrega en el día y horario que elijas."],
  ["Pedido por volumen", 0, "Servicios", "Precio especial por bulto."],
] as const);

const vetProducts = itemsWithoutPhotos("product", [
  ["Croquetas adulto", 520, "Alimento", "Bulto de 4 kg."],
  ["Croquetas cachorro", 480, "Alimento", "Bulto de 4 kg."],
  ["Arena para gato", 160, "Higiene", "Bolsa de 10 kg."],
  ["Antipulgas", 320, "Salud", "Pipeta para perro mediano."],
  ["Desparasitante", 120, "Salud", "Tableta por dosis."],
  ["Shampoo medicado", 210, "Higiene", "Frasco de 250 ml."],
  ["Collar ajustable", 120, "Accesorios", "Tallas S a L."],
  ["Correa", 150, "Accesorios", "Correa de 1.5 m."],
  ["Transportadora", 690, "Accesorios", "Para mascota de hasta 10 kg."],
  ["Juguete mordedera", 90, "Accesorios", "De hule resistente."],
  ["Premios", 85, "Alimento", "Bolsa de 200 g."],
  ["Vitaminas", 260, "Salud", "Frasco de 60 tabletas."],
  ["Cama mediana", 520, "Accesorios", "Para perro mediano."],
  ["Plato doble", 140, "Accesorios", "Agua y alimento."],
  ["Cepillo", 110, "Higiene", "Para pelo corto o largo."],
] as const);

const vetServices = itemsWithoutPhotos("service", [
  ["Consulta general", 350, "Consultas", "Revisión completa de tu mascota."],
  ["Vacuna", 400, "Consultas", "Vacuna múltiple con revisión."],
  ["Desparasitación", 180, "Consultas", "Dosis según el peso."],
  ["Corte de uñas", 80, "Estética", "Para perro o gato."],
  ["Estética básica", 300, "Estética", "Baño y corte para perro pequeño."],
  ["Baño medicado", 280, "Estética", "Con shampoo indicado por el médico."],
  ["Consulta de urgencia", 600, "Consultas", "Atención inmediata."],
  ["Certificado de salud", 400, "Consultas", "Para viaje o pensión."],
  ["Aplicación de medicamento", 120, "Consultas", "Inyección o curación sencilla."],
  ["Revisión de seguimiento", 200, "Consultas", "Después de una consulta o cirugía."],
] as const);

export const PRIMARY_STARTER_CATALOGS: CatalogDefinition[] = [
  { key: "tienda", version: 4, businessType: "tienda", name: "Tienda de abarrotes", description: `${groceryProducts.length} productos de tienda real con precios de referencia y 4 servicios.`, products: groceryProducts, services: groceryServices },
  { key: "ropa", version: 3, businessType: "boutique", name: "Boutique y ecommerce", description: "18 prendas y accesorios con 5 servicios de atención.", products: boutiqueProducts, services: boutiqueServices },
  { key: "autolavado", version: 3, businessType: "lavado_autos", name: "Autolavado", description: "6 productos de cuidado y 10 servicios listos para operar.", products: carwashProducts, services: carwashServices },
  { key: "materiales", version: 2, businessType: "materiales", name: "Materiales de construcción", description: "Material para obra, herramienta y apoyo logístico.", products: hardwareProducts, services: hardwareServices },
  { key: "taqueria", version: 2, businessType: "taqueria", name: "Taquería", description: "Tacos, bebidas y servicios para eventos.", products: taqueriaProducts, services: taqueriaServices },
  { key: "panaderia", version: 2, businessType: "panaderia", name: "Panadería", description: "Pan fresco, pastelería y pedidos para eventos.", products: bakeryProducts, services: bakeryServices },
  { key: "deposito-cerveza", version: 2, businessType: "deposito_cerveza", name: "Expendio de cerveza", description: "Bebidas frías, botanas y paquetes para reunión.", products: liquorProducts, services: liquorServices },
  { key: "cafeteria", version: 2, businessType: "cafeteria", name: "Cafetería", description: "Bebidas, alimentos ligeros y eventos corporativos.", products: cafeProducts, services: cafeServices },
  { key: "tenis", version: 2, businessType: "tenis", name: "Tienda de tenis", description: "Calzado, cuidado y restauración de sneakers.", products: sneakersProducts, services: sneakersServices },
  { key: "mascotas", version: 2, businessType: "mascotas", name: "Tienda de mascotas", description: "Alimento, accesorios y conveniencia para mascotas.", products: petsProducts, services: petsServices },
  { key: "veterinaria", version: 2, businessType: "veterinaria", name: "Veterinaria", description: "Salud, alimento y cuidado profesional de mascotas.", products: vetProducts, services: vetServices },
];
