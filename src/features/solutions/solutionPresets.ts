import type { CatalogDefinition } from "@/features/catalog/catalogDefinitions";

export interface SolutionPreset {
  catalogKey: CatalogDefinition["key"];
  defaultName: string;
  description: string;
  themeColor: string;
}

export const SOLUTION_PRESETS: SolutionPreset[] = [
  { catalogKey: "tienda", defaultName: "Abarrotes La Esquina", description: "Lo esencial de cada día, cerca de ti.", themeColor: "#3483fa" },
  { catalogKey: "panaderia", defaultName: "Panadería La Espiga", description: "Pan recién hecho y pedidos para cada celebración.", themeColor: "#c2410c" },
  { catalogKey: "deposito-cerveza", defaultName: "Depósito El Barril", description: "Bebidas frías y paquetes para tu reunión.", themeColor: "#7c3aed" },
  { catalogKey: "materiales", defaultName: "Materiales La Obra", description: "Material y logística para avanzar tu obra.", themeColor: "#b45309" },
  { catalogKey: "taqueria", defaultName: "Tacos Don Chuy", description: "Tacos al momento y pedidos para llevar.", themeColor: "#dc2626" },
  { catalogKey: "veterinaria", defaultName: "Veterinaria Patitas", description: "Cuidado profesional para quienes más quieres.", themeColor: "#0891b2" },
  { catalogKey: "mascotas", defaultName: "Mundo Mascota", description: "Alimento y accesorios para cada mascota.", themeColor: "#0f766e" },
  { catalogKey: "ropa", defaultName: "Boutique Luna", description: "Moda que acompaña tu estilo todos los días.", themeColor: "#be185d" },
  { catalogKey: "tenis", defaultName: "Sneaker Point", description: "Tenis, cuidado y estilo para cada paso.", themeColor: "#4f46e5" },
  { catalogKey: "cafeteria", defaultName: "Café Niebla", description: "Café de especialidad y pausas con sabor.", themeColor: "#0369a1" },
  { catalogKey: "autolavado", defaultName: "Autolavado Brillo Azul", description: "Lavado y detallado para que tu auto vuelva a brillar.", themeColor: "#3483fa" },
];

export function getSolutionPreset(catalogKey: string): SolutionPreset | undefined {
  return SOLUTION_PRESETS.find((preset) => preset.catalogKey === catalogKey);
}
