import { describe, it, expect, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sql, createTestServiceClient } from "@/test/integration/setup";
import { createSettlement } from "@/features/settlement/services/createSettlement";
import { advanceSettlement } from "@/features/settlement/services/advanceSettlement";

/**
 * INTEGRATION (S3): the settlement lifecycle end-to-end against real Postgres.
 * Proves that createSettlement reads the ledger, applies the S2 commission,
 * writes header + items, and that the UNIQUE(source_table, source_id) really
 * prevents double-settling a charge — the money-safety guarantee.
 */
describe("createSettlement + advanceSettlement (S3, integration)", () => {
  const admin = createTestServiceClient() as unknown as SupabaseClient;
  const slug = "itest-settle-tenant";
  let tenantId: string;

  afterEach(async () => {
    await sql`delete from settlement_items where settlement_id in (select id from settlements where tenant_id = ${tenantId ?? ""})`;
    await sql`delete from settlements where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from payments where order_id in (select id from orders where tenant_id = ${tenantId ?? ""})`;
    await sql`delete from orders where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from tenants where slug = ${slug}`;
  });

  async function seedMpCharges(amounts: number[]): Promise<void> {
    const [t] = await sql`insert into tenants (name, slug) values ('Settle', ${slug}) returning id`;
    tenantId = t.id;
    for (let i = 0; i < amounts.length; i++) {
      const [o] = await sql`
        insert into orders (tenant_id, payment_method, status, total)
        values (${tenantId}, 'mercadopago', 'paid', ${amounts[i]}) returning id`;
      await sql`
        insert into payments (order_id, provider, external_id, status, amount, payment_kind)
        values (${o.id}, 'mercadopago', ${"mp-settle-" + i}, 'approved', ${amounts[i]}, 'single')`;
    }
  }

  const period = {
    periodStart: "2020-01-01T00:00:00Z",
    periodEnd: "2100-01-01T00:00:00Z",
  };

  it("creates a settlement summing MP charges and applying the weekly commission", async () => {
    await seedMpCharges([100, 200]); // gross 300, net 300 (payments has no fee)

    const res = await createSettlement(admin, {
      tenantId,
      cycle: "weekly", // 3%
      ...period,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.grossMp).toBe(300);
    expect(res.data.netMp).toBe(300);
    expect(res.data.platformCommission).toBe(9); // 300 * 3%
    expect(res.data.amountToTransfer).toBe(291);
    expect(res.data.itemCount).toBe(2);

    // items really linked
    const items = await sql`select count(*)::int as n from settlement_items where settlement_id = ${res.data.settlementId}`;
    expect(items[0].n).toBe(2);
  });

  it("does NOT re-settle charges already in a settlement (idempotency)", async () => {
    await seedMpCharges([100, 200]);

    const first = await createSettlement(admin, { tenantId, cycle: "daily", ...period });
    expect(first.ok).toBe(true);

    // second run over the same period+charges → conflict (nothing fresh to settle)
    const second = await createSettlement(admin, {
      tenantId,
      cycle: "daily",
      periodStart: "2020-01-02T00:00:00Z", // different period bounds...
      periodEnd: "2099-01-01T00:00:00Z",
    });
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe("conflict"); // all charges already settled
  });

  it("advances through the lifecycle and requires a reference to confirm", async () => {
    await seedMpCharges([50]);
    const created = await createSettlement(admin, { tenantId, cycle: "monthly", ...period });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const id = created.data.settlementId;

    // open → closed → transfer_pending
    expect((await advanceSettlement(admin, { settlementId: id, to: "closed" })).ok).toBe(true);
    expect((await advanceSettlement(admin, { settlementId: id, to: "transfer_pending" })).ok).toBe(true);

    // confirming without a reference is rejected
    const noRef = await advanceSettlement(admin, { settlementId: id, to: "transfer_confirmed" });
    expect(noRef.ok).toBe(false);

    // with a reference + delivery evidence (note + proof photo) → confirmed,
    // and all of it is persisted as the "te entregué tu dinero" record.
    const ok = await advanceSettlement(admin, {
      settlementId: id,
      to: "transfer_confirmed",
      transferReference: "SPEI-12345",
      transferNote: "Entregado en efectivo, recibido por el dueño",
      transferProofUrl: "settlement-proofs/tenant/receipt.jpg",
    });
    expect(ok.ok).toBe(true);
    const rows = await sql`
      select status, transfer_reference, transfer_note, transfer_proof_url, transfer_confirmed_at
      from settlements where id = ${id}`;
    expect(rows[0].status).toBe("transfer_confirmed");
    expect(rows[0].transfer_reference).toBe("SPEI-12345");
    expect(rows[0].transfer_note).toBe("Entregado en efectivo, recibido por el dueño");
    expect(rows[0].transfer_proof_url).toBe("settlement-proofs/tenant/receipt.jpg");
    expect(rows[0].transfer_confirmed_at).not.toBeNull();
  });

  it("rejects an illegal transition (open → transfer_confirmed)", async () => {
    await seedMpCharges([50]);
    const created = await createSettlement(admin, { tenantId, cycle: "daily", ...period });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const res = await advanceSettlement(admin, {
      settlementId: created.data.settlementId,
      to: "transfer_confirmed",
      transferReference: "x",
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("conflict");
  });
});
