export interface CatalogItemDefinition {
  name: string;
  price: number;
  type: "product" | "service";
}

export interface CatalogDefinition {
  key: string;
  businessType: string;
  name: string;
  description: string;
  products: CatalogItemDefinition[];
  services: CatalogItemDefinition[];
}

const imageUrl = "/catalog/demo-product.svg";

function productItems(names: string[], base: number, step: number): CatalogItemDefinition[] {
  return names.map((name, index) => ({ name, price: base + index * step, type: "product" }));
}

function serviceItems(names: string[], base: number, step: number): CatalogItemDefinition[] {
  return names.map((name, index) => ({ name, price: base + index * step, type: "service" }));
}

export const DEMO_CATALOGS: CatalogDefinition[] = [
  {
    key: "tienda", businessType: "tienda", name: "Tienda de abarrotes", description: "Productos diarios, recargas y entrega local.",
    products: productItems(["Arroz 1 kg", "Frijol 900 g", "Aceite vegetal", "Leche entera", "Huevos 12 pzas", "Pan de caja", "Refresco 2 L", "Agua 1.5 L", "Papas clásicas", "Galletas surtidas", "Detergente 1 kg", "Jabón corporal", "Papel higiénico", "Atún en lata", "Café soluble"], 18, 11),
    services: serviceItems(["Recarga telefónica", "Pago de servicio", "Entrega local", "Pedido por WhatsApp", "Canasta básica", "Apartado", "Envoltura de regalo", "Impresión de comprobante", "Pedido por volumen", "Entrega programada"], 0, 15),
  },
  {
    key: "panaderia", businessType: "panaderia", name: "Panadería", description: "Pan fresco, pastelería y pedidos para eventos.",
    products: productItems(["Bolillo", "Concha", "Cuernito", "Dona glaseada", "Pan de elote", "Rosca individual", "Baguette", "Pastel de chocolate", "Pastel tres leches", "Galletas de mantequilla", "Empanada de piña", "Café americano", "Chocolate caliente", "Leche fría", "Caja de pan surtido"], 12, 18),
    services: serviceItems(["Pastel personalizado", "Mesa de postres", "Pedido por volumen", "Entrega local", "Pan para evento", "Caja corporativa", "Decoración de pastel", "Pastel temático", "Reserva de producción", "Coffee break"], 80, 180),
  },
  {
    key: "deposito-cerveza", businessType: "deposito_cerveza", name: "Expendio de cerveza", description: "Bebidas frías, botanas y paquetes para reunión.",
    products: productItems(["Cerveza clara lata", "Cerveza oscura lata", "Six pack", "Cerveza artesanal", "Refresco 2 L", "Agua mineral", "Hielo 5 kg", "Papas enchiladas", "Cacahuates", "Vaso desechable", "Michelada preparada", "Tequila 750 ml", "Whisky 750 ml", "Paquete fiesta", "Bolsa de hielo"], 22, 48),
    services: serviceItems(["Entrega local", "Enfriado express", "Paquete para fiesta", "Préstamo de hielera", "Pedido para evento", "Armado de micheladas", "Entrega programada", "Reserva de producto", "Cotización mayorista", "Carga al auto"], 0, 55),
  },
  {
    key: "materiales", businessType: "materiales", name: "Materiales de construcción", description: "Material para obra, herramienta y apoyo logístico.",
    products: productItems(["Cemento 50 kg", "Block hueco", "Varilla 3/8", "Arena por bulto", "Grava por bulto", "Pintura vinílica", "Brocha 4 pulgadas", "Rodillo", "Cinta métrica", "Martillo", "Clavos 1 kg", "Tornillos 100 pzas", "Impermeabilizante", "Taladro inalámbrico", "Escalera aluminio"], 35, 175),
    services: serviceItems(["Flete local", "Descarga de material", "Corte de varilla", "Cotización de obra", "Pedido por obra", "Entrega programada", "Asesoría de materiales", "Carga pesada", "Mezcla de pintura", "Reserva de material"], 80, 120),
  },
  {
    key: "taqueria", businessType: "taqueria", name: "Taquería", description: "Tacos, bebidas y servicios para eventos.",
    products: productItems(["Taco al pastor", "Taco de bistec", "Taco de suadero", "Taco de pollo", "Gringa", "Quesadilla", "Orden de pastor", "Volcán", "Refresco", "Agua fresca", "Horchata", "Papas preparadas", "Frijoles charros", "Postre del día", "Paquete familiar"], 18, 12),
    services: serviceItems(["Taquiza para 20 personas", "Taquiza para 50 personas", "Charola de tacos", "Catering", "Entrega local", "Pedido para oficina", "Servicio nocturno", "Barra de salsas", "Evento empresarial", "Reserva de mesa"], 250, 550),
  },
  {
    key: "veterinaria", businessType: "veterinaria", name: "Veterinaria", description: "Salud, alimento y cuidado profesional de mascotas.",
    products: productItems(["Croquetas adulto", "Croquetas cachorro", "Arena para gato", "Antipulgas", "Desparasitante", "Shampoo medicado", "Collar ajustable", "Correa", "Transportadora", "Juguete mordedera", "Premios", "Vitaminas", "Cama mediana", "Plato doble", "Cepillo"], 75, 85),
    services: serviceItems(["Consulta general", "Vacuna", "Desparasitación", "Corte de uñas", "Estética básica", "Baño medicado", "Consulta de urgencia", "Certificado de salud", "Aplicación de medicamento", "Revisión de seguimiento"], 90, 95),
  },
  {
    key: "mascotas", businessType: "mascotas", name: "Tienda de mascotas", description: "Alimento, accesorios y conveniencia para mascotas.",
    products: productItems(["Croquetas premium", "Lata para perro", "Lata para gato", "Arena aglomerante", "Juguete de cuerda", "Pelota resistente", "Cama pequeña", "Arnés", "Placa", "Rascador", "Cepillo", "Bebedero", "Premios naturales", "Pañales", "Pasta dental"], 45, 95),
    services: serviceItems(["Entrega local", "Paquete recurrente", "Grabado de placa", "Armado de kit", "Pedido por suscripción", "Asesoría de alimento", "Envoltura de regalo", "Reserva de producto", "Entrega programada", "Pedido por volumen"], 0, 45),
  },
  {
    key: "ropa", businessType: "boutique", name: "Boutique de ropa", description: "Moda, accesorios y servicio de atención personal.",
    products: productItems(["Blusa clásica", "Playera básica", "Jeans rectos", "Vestido casual", "Falda midi", "Suéter ligero", "Chamarra", "Bolsa de mano", "Cinturón", "Aretes", "Collar", "Gorra", "Pantalón de vestir", "Camisa lino", "Conjunto casual"], 120, 95),
    services: serviceItems(["Apartado", "Ajuste de prenda", "Envoltura de regalo", "Asesoría de estilo", "Entrega local", "Reserva de talla", "Pedido especial", "Cambio programado", "Empaque premium", "Compra para evento"], 0, 55),
  },
  {
    key: "tenis", businessType: "tenis", name: "Tienda de tenis", description: "Calzado, cuidado y restauración de sneakers.",
    products: productItems(["Tenis urbanos", "Tenis running", "Tenis casual", "Tenis infantil", "Agujetas blancas", "Agujetas de color", "Plantillas confort", "Protector impermeable", "Kit de limpieza", "Cepillo sneaker", "Calcetas deportivas", "Gorra deportiva", "Mochila", "Sandalia", "Tenis edición especial"], 180, 185),
    services: serviceItems(["Limpieza básica", "Limpieza profunda", "Restauración", "Cambio de agujetas", "Aplicación de protector", "Apartado", "Entrega local", "Reserva de talla", "Pedido especial", "Autenticación visual"], 80, 90),
  },
  {
    key: "cafeteria", businessType: "cafeteria", name: "Cafetería", description: "Bebidas, alimentos ligeros y eventos corporativos.",
    products: productItems(["Americano", "Capuchino", "Latte", "Chai", "Té", "Chocolate caliente", "Croissant", "Panini", "Bagel", "Rebanada de pastel", "Galleta", "Agua mineral", "Jugo natural", "Frappé", "Combo desayuno"], 35, 15),
    services: serviceItems(["Coffee break", "Catering", "Pedido para oficina", "Reserva de mesa", "Entrega local", "Barra de café", "Evento privado", "Pedido programado", "Paquete empresarial", "Taller de café"], 180, 320),
  },
  {
    key: "autolavado", businessType: "lavado_autos", name: "Autolavado", description: "Lavado, detallado y cuidado para cada vehículo.",
    products: productItems(["Shampoo para auto", "Cera líquida", "Aromatizante", "Limpiaparabrisas", "Microfibra", "Silicón para llantas", "Limpiador de interiores", "Esponja premium", "Protector de tablero", "Toalla de secado", "Desengrasante", "Líquido para frenos", "Aceite de motor", "Kit de emergencia", "Paquete de cuidado"], 45, 38),
    services: serviceItems(["Lavado básico", "Lavado completo", "Lavado de motor", "Aspirado interior", "Encerado", "Pulido de faros", "Detallado interior", "Lavado de vestiduras", "Sanitización", "Servicio a domicilio"], 120, 95),
  },
];

export function catalogImageUrl(): string {
  return imageUrl;
}
