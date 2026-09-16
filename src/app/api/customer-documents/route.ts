/* eslint-disable @typescript-eslint/no-explicit-any -- private document tables ship in the paired migration. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createPublicDocumentToken } from "@/lib/publicDocumentToken";
import { sendEmail } from "@/lib/email/sendgrid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const TABLE_BY_TYPE = { quote: "quotes", order: "orders", loan_payment: "loan_payments", credit_account: "customer_credit_accounts" } as const;
type DocumentType = keyof typeof TABLE_BY_TYPE;

function validType(value: unknown): value is DocumentType { return typeof value === "string" && value in TABLE_BY_TYPE; }

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { tenant_id?: string; entity_type?: unknown; entity_id?: string; expires_in_days?: number; delivery?: "email"; recipient_email?: string };
  if (!body.tenant_id || !body.entity_id || !validType(body.entity_type)) return NextResponse.json({ error: "Documento inválido." }, { status: 400 });
  const db = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: membership } = await db.from("tenant_memberships").select("id").eq("tenant_id", body.tenant_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const table = TABLE_BY_TYPE[body.entity_type];
  const { data: entity } = await db.from(table).select("id, tenant_id").eq("id", body.entity_id).maybeSingle();
  if (!entity || entity.tenant_id !== body.tenant_id) return NextResponse.json({ error: "No encontramos el documento en este negocio." }, { status: 404 });
  const { token, tokenHash } = createPublicDocumentToken();
  const days = Math.min(Math.max(Number(body.expires_in_days ?? 30), 1), 365);
  const { error } = await db.from("customer_document_links").insert({ tenant_id: body.tenant_id, entity_type: body.entity_type, entity_id: body.entity_id, token_hash: tokenHash, expires_at: new Date(Date.now() + days * 86400000).toISOString(), created_by: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const url = `${new URL(request.url).origin}/comprobante/${token}`;
  let emailDelivery: "not_requested" | "sent" | "failed" = "not_requested";
  if (body.delivery === "email" && body.recipient_email?.trim()) {
    try {
      await sendEmail({
        to: body.recipient_email.trim(),
        subject: "Tu comprobante Tlaco",
        html: `<p>Te compartimos tu comprobante privado.</p><p><a href="${url}">Ver comprobante</a></p>`,
      });
      emailDelivery = "sent";
    } catch {
      // Link creation is already complete.  A mail provider outage must never
      // roll back a sale, quote or credit payment.
      emailDelivery = "failed";
    }
  }
  return NextResponse.json({ url, email_delivery: emailDelivery });
}
