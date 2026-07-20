import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";
import { NextResponse } from "next/server";

/**
 * GET /api/me/platform-admin — is the current user a platform super admin?
 *
 * Lets the client (Sidebar) show platform-only navigation. isPlatformAdmin is
 * server-only, so the UI can't check it directly — this thin endpoint exposes
 * just the boolean for the logged-in user.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ isPlatformAdmin: false });
  }

  return NextResponse.json({
    isPlatformAdmin: await isPlatformAdmin(user.id),
  });
}
