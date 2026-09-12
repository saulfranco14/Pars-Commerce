import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  // `permissions` viaja al cliente porque la descripción que ve quien invita
  // se compone de los permisos reales del rol, no de su nombre: un rol
  // personalizado no tendría descripción, y si alguien edita los permisos de
  // un rol de sistema una descripción por nombre se volvería mentira.
  const { data: roles, error } = await supabase
    .from("tenant_roles")
    .select("id, name, permissions")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(roles ?? []);
}
