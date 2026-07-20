/**
 * Setup para los tests de INTEGRACIÓN (`*.itest.ts`), contra la Supabase
 * local (`supabase start`, requiere Docker). Ejercita Postgres real: las 49
 * migraciones, RLS y triggers. Es la capa que responde "¿sube correcto de
 * verdad?".
 *
 * Dos vías de acceso, cada una para su propósito:
 *  - `sql` (driver `postgres` directo, rol superusuario `postgres`): para
 *    SEMBRAR y LIMPIAR datos de prueba. Salta RLS y grants — ideal para
 *    fixtures, no representa cómo la app accede.
 *  - `createTestServiceClient()` (`supabase-js` con service_role): el MISMO
 *    camino que usa el código de producción (`createAdminClient`). Los tests
 *    de comportamiento de servicios usan éste.
 *  - `createTestAnonClient()` (`supabase-js` con anon key): para verificar
 *    que RLS bloquea/permite lo correcto a un visitante sin sesión.
 *
 * Credenciales = defaults FIJOS de la CLI de Supabase (públicos, locales, no
 * sirven en prod). Sobreescribibles por env var.
 */
import postgres from "postgres";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, afterAll } from "vitest";

const API_URL = process.env.SUPABASE_TEST_URL ?? "http://127.0.0.1:54321";
const DB_URL =
  process.env.SUPABASE_TEST_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SERVICE_KEY =
  process.env.SUPABASE_TEST_SERVICE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// Point the app's own clients (createAdminClient / createClient) at the LOCAL
// instance so that code under test which builds its own Supabase client (e.g.
// isPlatformAdmin via createAdminClient) hits the test DB, not production.
process.env.NEXT_PUBLIC_SUPABASE_URL = API_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;

/** Conexión directa a Postgres (superusuario). Para sembrar/limpiar. */
export const sql = postgres(DB_URL, { max: 4, onnotice: () => {} });

/** Cliente supabase-js con service_role — mismo camino que createAdminClient. */
export function createTestServiceClient(): SupabaseClient {
  return createClient(API_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Cliente supabase-js anónimo — para probar RLS como visitante sin sesión. */
export function createTestAnonClient(): SupabaseClient {
  return createClient(API_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

beforeAll(async () => {
  try {
    await sql`select 1`;
  } catch (e) {
    throw new Error(
      `No se pudo conectar a la Postgres local (${DB_URL}). ` +
        `¿Corriste 'supabase start' con Docker abierto? Detalle: ${
          e instanceof Error ? e.message : String(e)
        }`,
    );
  }
}, 30_000);

afterAll(async () => {
  await sql.end({ timeout: 5 });
});
