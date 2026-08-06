import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../../../_lib";

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const { userId } = await params;
  const { status, reason } = await request.json() as { status?: "suspended" | "active"; reason?: string };
  if (status !== "suspended" && status !== "active") return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  if (status === "suspended" && !reason?.trim()) return NextResponse.json({ error: "Indica el motivo de la suspensión" }, { status: 400 });
  if (userId === gate.user.id) return NextResponse.json({ error: "No puedes suspender tu propio acceso" }, { status: 409 });
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, status === "suspended" ? { ban_duration: "876000h" } : { ban_duration: "none" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("platform_activity_events" as never).insert({
    actor_id: gate.user.id,
    action: status === "suspended" ? "platform.user_suspended" : "platform.user_reactivated",
    entity_type: "user",
    entity_id: userId,
    payload: { reason: status === "suspended" ? reason!.trim() : null },
  } as never);
  return NextResponse.json({ success: true });
}
