import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureCustomer(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  customerName: string,
  customerEmail: string,
  customerPhone?: string,
): Promise<string | null> {
  const normalizedEmail = customerEmail.trim().toLowerCase();
  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", normalizedEmail)
    .single();

  if (existing?.id) return existing.id;

  const { data: created } = await admin
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: customerName.trim(),
      email: normalizedEmail,
      phone: customerPhone?.trim() || null,
    })
    .select("id")
    .single();

  return created?.id ?? null;
}
