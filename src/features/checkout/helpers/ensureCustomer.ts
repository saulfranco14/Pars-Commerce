/* eslint-disable @typescript-eslint/no-explicit-any -- normalized_phone is not in the generated Supabase types yet. */
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeMxPhone } from "@/lib/customers/customerIdentity";

type Loose = { from: (table: string) => any };

/**
 * One customer per person per business: matched by email first, then by
 * phone (the identity the QR flow and memberships use), so a buyer who pays
 * online and later shows up at the counter is the same record.
 */
export async function ensureCustomer(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  customerName: string,
  customerEmail: string,
  customerPhone?: string,
): Promise<string | null> {
  const db = admin as unknown as Loose;
  const normalizedEmail = customerEmail.trim().toLowerCase();
  const normalizedPhone = customerPhone ? normalizeMxPhone(customerPhone) : null;

  const { data: byEmail } = await db
    .from("customers")
    .select("id, normalized_phone")
    .eq("tenant_id", tenantId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (byEmail?.id) {
    if (normalizedPhone && !byEmail.normalized_phone) {
      // Ignored on conflict: that phone already belongs to another customer.
      await db.from("customers").update({ normalized_phone: normalizedPhone, phone: customerPhone?.trim() }).eq("id", byEmail.id);
    }
    return byEmail.id;
  }

  if (normalizedPhone) {
    const { data: byPhone } = await db
      .from("customers")
      .select("id, email")
      .eq("tenant_id", tenantId)
      .eq("normalized_phone", normalizedPhone)
      .maybeSingle();
    if (byPhone?.id) {
      if (!byPhone.email) await db.from("customers").update({ email: normalizedEmail }).eq("id", byPhone.id);
      return byPhone.id;
    }
  }

  const { data: created } = await db
    .from("customers")
    .insert({
      tenant_id: tenantId,
      name: customerName.trim(),
      email: normalizedEmail,
      phone: customerPhone?.trim() || null,
      normalized_phone: normalizedPhone,
    })
    .select("id")
    .single();

  return created?.id ?? null;
}
