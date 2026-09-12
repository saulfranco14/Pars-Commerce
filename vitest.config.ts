import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Alias "@/..." → "src/..." (mismo mapeo que tsconfig.json). No usamos
// vite-tsconfig-paths para no sumar otra dependencia: un solo alias basta.
const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${srcPath}/`,
    },
  },
  test: {
    // Dos proyectos con el mismo runner:
    //  - unit:        lógica pura contra el fakeSupabase. Sin red, sin DB.
    //                 Corre siempre (watch + CI). Archivos *.test.ts.
    //  - integration: contra Postgres real (supabase start / Docker).
    //                 Ejercita RLS, triggers, columnas reales.
    //                 Archivos *.itest.ts. Necesita setup de conexión.
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.itest.ts"],
          // El setup (conexión a la DB local + limpieza entre tests) se
          // agrega en la fase T0b. Por ahora el proyecto existe pero no
          // tiene tests todavía.
          setupFiles: ["src/test/integration/setup.ts"],
        },
      },
    ],
  },
});
