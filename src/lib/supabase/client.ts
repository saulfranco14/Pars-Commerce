import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

let browserClient: SupabaseClient<Database> | undefined;

function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/**
 * Keep one browser client per tab. Refresh tokens rotate on every successful
 * refresh, so independent clients can otherwise race and leave the losing one
 * with an already-invalid token.
 */
export function createClient() {
  if (typeof window === "undefined") return createBrowserSupabaseClient();
  browserClient ??= createBrowserSupabaseClient();
  return browserClient;
}
