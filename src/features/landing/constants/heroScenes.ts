import type { HeroGiroLink, HeroScene } from "@/features/landing/interfaces/heroScene";

export const HERO_SCENE_DURATION_MS = 6000;

export const HERO_STEPS = [
  { title: "Escanea el QR", detail: "Sin descargar nada", short: "Escanea el QR" },
  { title: "Pide desde su celular", detail: "Tú lo preparas", short: "Pide sin app" },
  { title: "Paga cuando está listo", detail: "Y lo ves en tu panel", short: "Paga y lo ves" },
] as const;

export const HERO_SCENES: HeroScene[] = [
  {
    key: "autolavado",
    word: "autolavado",
    place: "Bahía 2",
    image: "/landing/autolavado-hero.png",
    alt: "Autolavado con un auto recién lavado",
    items: [
      { name: "Lavado completo", price: 180 },
      { name: "Encerado", price: 120 },
      { name: "Aromatizante", price: 25 },
    ],
  },
  {
    key: "taqueria",
    word: "taquería",
    place: "Mesa 4",
    image: "/landing/comida-hero.png",
    alt: "Taquería atendiendo pedidos",
    items: [
      { name: "Orden de pastor", price: 90 },
      { name: "Gringa", price: 65 },
      { name: "Agua de horchata", price: 35 },
    ],
  },
  {
    key: "ropa",
    word: "boutique",
    place: "Caja 1",
    image: "/landing/moda-hero.png",
    alt: "Boutique de ropa",
    items: [
      { name: "Blusa de lino", price: 420 },
      { name: "Jeans recto", price: 590 },
      { name: "Cinturón", price: 180 },
    ],
  },
  {
    key: "veterinaria",
    word: "veterinaria",
    place: "Consultorio 1",
    image: "/landing/veterinaria-hero.png",
    alt: "Veterinaria atendiendo a una mascota",
    items: [
      { name: "Consulta general", price: 350 },
      { name: "Vacuna", price: 280 },
      { name: "Desparasitante", price: 90 },
    ],
  },
  {
    key: "panaderia",
    word: "panadería",
    place: "Mostrador",
    image: "/landing/panaderia-hero.png",
    alt: "Panadería con pan recién hecho",
    items: [
      { name: "Café americano", price: 35 },
      { name: "Pan de elote", price: 45 },
      { name: "Concha", price: 18 },
    ],
  },
  {
    key: "tienda",
    word: "tienda",
    place: "Mostrador",
    image: "/landing/tienda-hero.png",
    alt: "Tienda de abarrotes",
    items: [
      { name: "Pan de caja", price: 52 },
      { name: "Huevo 12 piezas", price: 48 },
      { name: "Refresco 2 L", price: 38 },
    ],
  },
];

/** Words campaigns tend to use in `utm_content` for the same business type. */
export const HERO_SCENE_ALIASES: Record<string, string> = {
  boutique: "ropa",
  moda: "ropa",
  abarrotes: "tienda",
  tacos: "taqueria",
  pan: "panaderia",
  vet: "veterinaria",
  lavado: "autolavado",
};

export const HERO_GIRO_LINKS: HeroGiroLink[] = [
  { label: "Taquerías", href: "/soluciones/taqueria", image: "/landing/comida-hero.png" },
  { label: "Autolavados", href: "/soluciones/autolavado", image: "/landing/autolavado-hero.png" },
  { label: "Boutiques", href: "/soluciones/ropa", image: "/landing/moda-hero.png" },
  { label: "Veterinarias", href: "/soluciones/veterinaria", image: "/landing/veterinaria-hero.png" },
  { label: "Panaderías", href: "/soluciones/panaderia", image: "/landing/panaderia-hero.png" },
  { label: "Abarrotes", href: "/soluciones/tienda", image: "/landing/tienda-hero.png" },
  { label: "Tenis y calzado", href: "/soluciones/tenis", image: "/landing/tenis-hero.png" },
  { label: "Mascotas", href: "/soluciones/mascotas", image: "/landing/mascotas-hero.png" },
];
