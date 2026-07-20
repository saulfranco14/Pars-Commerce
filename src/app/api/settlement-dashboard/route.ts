import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { getPlatformDashboard } from "@/features/settlement/services/platformDashboard";
import { NextResponse } from "next/server";

/**
 * GET /api/settlement-dashboard — the platform treasury board (S5).
 *
 * PLATFORM SUPER ADMIN ONLY. Cross-tenant: how much we owe, to whom, what needs
 * action (close / send transfer), what's disputed, commission earned. This is
 * the "operate thousands of businesses" view.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isPlatformAdmin(user.id))) {
    // Not even a hint of the data to non-admins.
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const dashboard = await getPlatformDashboard(admin);
  return NextResponse.json(dashboard);
}
