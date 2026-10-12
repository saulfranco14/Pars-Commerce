import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  // A service worker in `next dev` can keep a bundle from another worktree or
  // branch alive after route files are moved. PWA behaviour remains enabled
  // for preview/production builds, where the cache is useful to customers.
  disable: process.env.NODE_ENV !== "production",
  additionalPrecacheEntries: [{ url: "/offline", revision: "offline-v1" }],
});

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/demo", destination: "/soluciones/tienda", permanent: true },
      { source: "/demo/abarrotes", destination: "/soluciones/tienda", permanent: true },
      { source: "/demo/boutique", destination: "/soluciones/ropa", permanent: true },
      { source: "/demo/autolavado", destination: "/soluciones/autolavado", permanent: true },
      { source: "/demo/:vertical", destination: "/soluciones/:vertical", permanent: true },
      { source: "/sitio/demo-abarrotes-la-esquina", destination: "/soluciones/tienda", permanent: true },
      { source: "/sitio/demo-panaderia-la-espiga", destination: "/soluciones/panaderia", permanent: true },
      { source: "/sitio/demo-deposito-el-barril", destination: "/soluciones/deposito-cerveza", permanent: true },
      { source: "/sitio/demo-materiales-la-obra", destination: "/soluciones/materiales", permanent: true },
      { source: "/sitio/demo-tacos-don-chuy", destination: "/soluciones/taqueria", permanent: true },
      { source: "/sitio/demo-veterinaria-patitas", destination: "/soluciones/veterinaria", permanent: true },
      { source: "/sitio/demo-mundo-mascota", destination: "/soluciones/mascotas", permanent: true },
      { source: "/sitio/demo-boutique-luna", destination: "/soluciones/ropa", permanent: true },
      { source: "/sitio/demo-sneaker-point", destination: "/soluciones/tenis", permanent: true },
      { source: "/sitio/demo-cafe-niebla", destination: "/soluciones/cafeteria", permanent: true },
      { source: "/sitio/demo-autolavado-brillo-azul", destination: "/soluciones/autolavado", permanent: true },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    viewTransition: true,
    // En Windows/WSL el proceso hijo de validación puede cerrarse sin reportar
    // el diagnóstico. Los workers de hilo conservan lint y tipos, pero evitan
    // ese cierre prematuro del worker de build.
    workerThreads: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    minimumCacheTTL: 31536000,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 768, 1024, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
  },
};

export default withSerwist(nextConfig);
