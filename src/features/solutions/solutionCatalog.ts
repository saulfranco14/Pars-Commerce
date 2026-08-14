import { DEMO_CATALOGS, type CatalogDefinition } from "@/features/catalog/catalogDefinitions";
import { DEMO_PORTFOLIO, type DemoPortfolioItem } from "@/features/catalog/demoPortfolio";

export interface SolutionDefinition {
  path: string;
  heroImage: string;
  eyebrow: string;
  headline: string;
  problem: string;
  workflow: [string, string, string];
  demo: DemoPortfolioItem;
  catalog: CatalogDefinition;
}

const PRESENTATION: Record<string, Omit<SolutionDefinition, "demo" | "catalog">> = {
  tienda: { path: "tienda", heroImage: "/landing/tienda-hero.png", eyebrow: "Tlaco para tiendas de barrio", headline: "Tu tienda siempre lista para vender, aun cuando tú estás ocupándote de todo.", problem: "Organiza abarrotes, recargas, pedidos y entregas sin perder la cuenta de lo que se vendió.", workflow: ["Publica tu catálogo diario", "Recibe el pedido por tienda o WhatsApp", "Confirma pago y preparación desde Tlaco"] },
  panaderia: { path: "panaderia", heroImage: "/landing/panaderia-hero.png", eyebrow: "Tlaco para panaderías", headline: "Pan fresco, pedidos especiales y una vitrina que también vende en línea.", problem: "Da visibilidad a tu pan del día, pasteles y pedidos por volumen sin depender de mensajes sueltos.", workflow: ["Muestra pan y pasteles disponibles", "Agenda pedidos personalizados", "Comparte confirmación y hora de entrega"] },
  "deposito-cerveza": { path: "deposito-cerveza", heroImage: "/landing/deposito-hero.png", eyebrow: "Tlaco para expendios", headline: "Vende bebidas frías y paquetes sin perder el control de cada pedido.", problem: "Combina mostrador, entrega local y pedidos para evento en la misma operación.", workflow: ["Publica bebidas y paquetes", "Crea la orden antes de abrir WhatsApp", "Confirma el cobro por el flujo autorizado"] },
  materiales: { path: "materiales", heroImage: "/landing/materiales-hero.png", eyebrow: "Tlaco para materiales", headline: "Cotiza, vende y coordina entregas de obra desde un solo lugar.", problem: "Mantén claros el material, el flete y el pedido de cada cliente sin perseguir conversaciones.", workflow: ["Comparte catálogo y cotización", "Registra pedido y entrega", "Da seguimiento desde una sola orden"] },
  taqueria: { path: "taqueria", heroImage: "/landing/comida-hero.png", eyebrow: "Tlaco para taquerías", headline: "Tienda, QR de mesa y mostrador: todos tus tacos terminan en la misma orden.", problem: "Evita tickets duplicados entre el salón, el kiosco y los pedidos para llevar.", workflow: ["Cliente pide por QR, kiosco o tienda", "Cocina ve una sola cola", "Comparte aviso de pedido listo"] },
  veterinaria: { path: "veterinaria", heroImage: "/landing/mascotas-hero.png", eyebrow: "Tlaco para veterinarias", headline: "Productos, consulta y seguimiento para cuidar mejor a cada mascota.", problem: "Conecta alimento, servicios y recordatorios sin mezclar la comunicación con los pagos.", workflow: ["Publica alimento y servicios", "Agenda la atención", "Envía recordatorios con enlace seguro"] },
  mascotas: { path: "mascotas", heroImage: "/landing/mascotas-hero.png", eyebrow: "Tlaco para tiendas de mascotas", headline: "Haz que cada compra de mascota vuelva a tu tienda.", problem: "Vende alimento y accesorios, y convierte pedidos frecuentes en una experiencia ordenada.", workflow: ["Muestra catálogo por necesidad", "Recibe pedido en un solo flujo", "Activa recordatorios de recompra"] },
  ropa: { path: "ropa", heroImage: "/landing/moda-hero.png", eyebrow: "Tlaco para boutiques", headline: "Tu estilo, tu catálogo y tus apartados en un mismo lugar.", problem: "Organiza tallas, apartados y pedidos especiales sin depender de una libreta o chats dispersos.", workflow: ["Publica prendas destacadas", "Registra apartado o pedido", "Comparte seguimiento con tu cliente"] },
  tenis: { path: "tenis", heroImage: "/landing/tenis-hero.png", eyebrow: "Tlaco para tiendas de tenis", headline: "Cada par, apartado y servicio de limpieza bajo control.", problem: "Vende calzado y servicios sin perder la talla, disponibilidad o seguimiento del cliente.", workflow: ["Muestra pares y accesorios", "Registra apartado o servicio", "Comparte aviso de disponibilidad"] },
  cafeteria: { path: "cafeteria", heroImage: "/landing/comida-hero.png", eyebrow: "Tlaco para cafeterías", headline: "De la barra a la mesa: vende café sin enredar tu operación.", problem: "Conecta carta, pedidos para llevar, QR y coffee breaks en una sola vista.", workflow: ["Publica carta y combos", "Recibe pedidos por QR o tienda", "Avísale al cliente cuando esté listo"] },
  autolavado: { path: "autolavado", heroImage: "/landing/autolavado-hero.png", eyebrow: "Tlaco para autolavados", headline: "Cada auto, servicio y hora de entrega bajo control.", problem: "Organiza lavados, detallados y clientes recurrentes sin perder el avance de cada vehículo.", workflow: ["Publica servicios y paquetes", "Registra el vehículo y la orden", "Comparte el aviso de auto listo"] },
};

export const SOLUTIONS: SolutionDefinition[] = DEMO_PORTFOLIO.map((demo) => {
  const catalog = DEMO_CATALOGS.find((item) => item.key === demo.catalogKey);
  const presentation = PRESENTATION[demo.catalogKey];
  if (!catalog || !presentation) throw new Error(`Solución incompleta para ${demo.catalogKey}`);
  return { ...presentation, demo, catalog };
});

export function getSolutionByVertical(vertical: string): SolutionDefinition | undefined {
  return SOLUTIONS.find((solution) => solution.path === vertical);
}

export function getSolutionByDemoSlug(slug: string): SolutionDefinition | undefined {
  return SOLUTIONS.find((solution) => solution.demo.slug === slug);
}
