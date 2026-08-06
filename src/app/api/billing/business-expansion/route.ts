import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdditionalBusinessAccess } from "@/features/billing/businessExpansion";

/** Queried only after the owner intentionally taps "Crear otro negocio". */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(
      await getAdditionalBusinessAccess(createAdminClient() as any, user.id),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No pudimos validar tu plan" },
      { status: 500 },
    );
  }
}
