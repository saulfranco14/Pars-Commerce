import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StudioDatabase } from "@/types/studio.database";

export type StudioDb = SupabaseClient<StudioDatabase>;
export function studioDb(): StudioDb {
  return createAdminClient() as unknown as StudioDb;
}
