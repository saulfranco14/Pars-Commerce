import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, phone, role_type, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profile) {
    const displayName =
      (user.user_metadata?.display_name as string) ??
      (user.user_metadata?.full_name as string) ??
      user.email?.split("@")[0] ??
      "";

    const { data: upserted, error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          display_name: displayName,
        },
        { onConflict: "id" }
      )
      .select(
        "id, email, display_name, avatar_url, phone, role_type, created_at"
      )
      .single();

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json(upserted);
  }

  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { display_name, phone, avatar_url } = body as {
    display_name?: string;
    phone?: string;
    avatar_url?: string;
  };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (display_name !== undefined)
    updates.display_name = display_name?.trim() ?? null;
  if (phone !== undefined) updates.phone = phone?.trim() ?? null;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url?.trim() ?? null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, email, display_name, avatar_url, phone, role_type, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profile);
}
