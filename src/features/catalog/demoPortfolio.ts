import type { CatalogDefinition } from "@/features/catalog/catalogDefinitions";

export interface DemoPortfolioItem {
  catalogKey: CatalogDefinition["key"];
  demoKey: string;
  name: string;
  slug: string;
  description: string;
  themeColor: string;
}

/** Public examples, kept non-operational until explicitly enabled. */
export const DEMO_PORTFOLIO: DemoPortfolioItem[] = [
  { catalogKey: "tienda", demoKey: "abarrotes-la-esquina", name: "Abarrotes La Esquina", slug: "demo-abarrotes-la-esquina", description: "Lo esencial de cada día, cerca de ti.", themeColor: "#2563eb" },
  { catalogKey: "panaderia", demoKey: "panaderia-la-espiga", name: "Panadería La Espiga", slug: "demo-panaderia-la-espiga", description: "Pan recién hecho y pedidos para cada celebración.", themeColor: "#c2410c" },
  { catalogKey: "deposito-cerveza", demoKey: "deposito-el-barril", name: "Depósito El Barril", slug: "demo-deposito-el-barril", description: "Bebidas frías y paquetes para tu reunión.", themeColor: "#7c3aed" },
  { catalogKey: "materiales", demoKey: "materiales-la-obra", name: "Materiales La Obra", slug: "demo-materiales-la-obra", description: "Material y logística para avanzar tu obra.", themeColor: "#b45309" },
  { catalogKey: "taqueria", demoKey: "tacos-don-chuy", name: "Tacos Don Chuy", slug: "demo-tacos-don-chuy", description: "Tacos al momento y taquizas para tus eventos.", themeColor: "#dc2626" },
  { catalogKey: "veterinaria", demoKey: "veterinaria-patitas", name: "Veterinaria Patitas", slug: "demo-veterinaria-patitas", description: "Cuidado profesional para quienes más quieres.", themeColor: "#0891b2" },
  { catalogKey: "mascotas", demoKey: "mundo-mascota", name: "Mundo Mascota", slug: "demo-mundo-mascota", description: "Alimento, accesorios y conveniencia para tu mascota.", themeColor: "#0f766e" },
  { catalogKey: "ropa", demoKey: "boutique-luna", name: "Boutique Luna", slug: "demo-boutique-luna", description: "Moda que acompaña tu estilo todos los días.", themeColor: "#be185d" },
  { catalogKey: "tenis", demoKey: "sneaker-point", name: "Sneaker Point", slug: "demo-sneaker-point", description: "Tenis, cuidado y estilo para cada paso.", themeColor: "#4f46e5" },
  { catalogKey: "cafeteria", demoKey: "cafe-niebla", name: "Café Niebla", slug: "demo-cafe-niebla", description: "Café de especialidad y pausas con sabor.", themeColor: "#0369a1" },
  { catalogKey: "autolavado", demoKey: "autolavado-brillo-azul", name: "Autolavado Brillo Azul", slug: "demo-autolavado-brillo-azul", description: "Lavado y detallado para que tu auto vuelva a brillar.", themeColor: "#3483fa" },
];
