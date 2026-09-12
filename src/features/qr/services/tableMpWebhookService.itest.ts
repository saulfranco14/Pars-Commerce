import { describe, it, expect, afterEach } from "vitest";
import { sql, createTestServiceClient } from "@/test/integration/setup";

/**
 * INTEGRATION (P2): proves the unique index really makes the QR payment insert
 * idempotent against a re-delivered webhook. A fake can't test a DB constraint
 * — only real Postgres enforces `idx_payments_provider_external_id`. This is
 * the check that guarantees "MP resends the webhook → no duplicate payment".
 */
describe("payments idempotency via unique index (P2, integration)", () => {
  const admin = createTestServiceClient();
  const slug = "itest-idem-tenant";
  let orderId: string;

  afterEach(async () => {
    await sql`delete from payments where order_id = ${orderId ?? ""}`;
    await sql`delete from orders where id = ${orderId ?? ""}`;
    await sql`delete from tenants where slug = ${slug}`;
  });

  it("rejects a second payment with the same (provider, external_id)", async () => {
    const [t] = await sql`insert into tenants (name, slug) values ('Idem', ${slug}) returning id`;
    const [o] = await sql`insert into orders (tenant_id) values (${t.id}) returning id`;
    orderId = o.id;

    const row = {
      order_id: orderId,
      provider: "mercadopago",
      external_id: "mp-dup-777",
      status: "approved",
      amount: 100,
      payment_kind: "single",
    };

    // First insert — the real webhook path — succeeds.
    const first = await admin.from("payments").insert(row);
    expect(first.error).toBeNull();

    // Second insert (webhook re-delivered) — must be rejected by the unique
    // index with code 23505. This is exactly what the hardened handler
    // swallows so a resend is a no-op instead of a duplicate charge.
    const second = await admin.from("payments").insert(row);
    expect(second.error).not.toBeNull();
    expect(second.error?.code).toBe("23505");

    // And there is exactly ONE payment row for that MP id.
    const rows = await sql`
      select id from payments
      where order_id = ${orderId} and external_id = 'mp-dup-777'`;
    expect(rows).toHaveLength(1);
  });
});
