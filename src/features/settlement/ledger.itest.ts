import { describe, it, expect, afterEach } from "vitest";
import { sql } from "@/test/integration/setup";

/**
 * INTEGRATION (S1): the payment_ledger view unifies confirmed charges from the
 * different payment tables against real Postgres — proving the column mapping,
 * the tenant/method join, and is_platform_custodied are correct against the
 * real schema. A view that references a wrong column simply wouldn't apply
 * (caught at migration time); this proves the DATA comes out right.
 */
describe("payment_ledger view (S1, integration)", () => {
  const slug = "itest-ledger-tenant";
  let tenantId: string;

  afterEach(async () => {
    // children → parents
    await sql`delete from payments where order_id in (select id from orders where tenant_id = ${tenantId ?? ""})`;
    await sql`delete from loan_payments where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from loans where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from customers where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from orders where tenant_id = ${tenantId ?? ""}`;
    await sql`delete from tenants where slug = ${slug}`;
  });

  it("unifies a MP payment and a cash payment with correct method + custody flag", async () => {
    const [t] = await sql`insert into tenants (name, slug) values ('Ledger', ${slug}) returning id`;
    tenantId = t.id;

    // MP order + payment (platform-custodied)
    const [mpOrder] = await sql`
      insert into orders (tenant_id, payment_method, status, total)
      values (${tenantId}, 'mercadopago', 'paid', 100) returning id`;
    await sql`
      insert into payments (order_id, provider, external_id, status, amount, payment_kind)
      values (${mpOrder.id}, 'mercadopago', 'mp-led-1', 'approved', 100, 'single')`;

    // Cash order + payment (NOT platform-custodied — business already has it)
    const [cashOrder] = await sql`
      insert into orders (tenant_id, payment_method, status, total)
      values (${tenantId}, 'efectivo', 'paid', 50) returning id`;
    await sql`
      insert into payments (order_id, provider, status, amount, payment_kind)
      values (${cashOrder.id}, 'manual', 'approved', 50, 'single')`;

    const rows = await sql`
      select payment_method, amount_gross, is_platform_custodied, kind
      from payment_ledger
      where tenant_id = ${tenantId}
      order by amount_gross desc`;

    expect(rows).toHaveLength(2);
    // MP row
    expect(rows[0]).toMatchObject({
      payment_method: "mercadopago",
      is_platform_custodied: true,
    });
    expect(Number(rows[0].amount_gross)).toBe(100);
    // cash row
    expect(rows[1]).toMatchObject({
      payment_method: "efectivo",
      is_platform_custodied: false,
    });
  });

  it("includes a loan payment with its MP fee and net", async () => {
    const [t] = await sql`insert into tenants (name, slug) values ('Ledger', ${slug}) returning id`;
    tenantId = t.id;
    const [c] = await sql`
      insert into customers (tenant_id, name) values (${tenantId}, 'Cli') returning id`;
    const [loan] = await sql`
      insert into loans (tenant_id, customer_id, concept, amount)
      values (${tenantId}, ${c.id}, 'Préstamo', 1000) returning id`;
    await sql`
      insert into loan_payments (loan_id, tenant_id, amount, payment_method, mp_fee_amount, mp_net_amount)
      values (${loan.id}, ${tenantId}, 500, 'mercadopago', 20, 480)`;

    const rows = await sql`
      select kind, amount_gross, fee_amount, net_amount, is_platform_custodied
      from payment_ledger
      where tenant_id = ${tenantId} and kind = 'loan'`;

    expect(rows).toHaveLength(1);
    expect(Number(rows[0].amount_gross)).toBe(500);
    expect(Number(rows[0].fee_amount)).toBe(20);
    expect(Number(rows[0].net_amount)).toBe(480);
    expect(rows[0].is_platform_custodied).toBe(true);
  });

  it("aggregates 'how much came in by method' for a tenant (the core query)", async () => {
    const [t] = await sql`insert into tenants (name, slug) values ('Ledger', ${slug}) returning id`;
    tenantId = t.id;
    const [o1] = await sql`insert into orders (tenant_id, payment_method, status, total) values (${tenantId}, 'mercadopago', 'paid', 100) returning id`;
    const [o2] = await sql`insert into orders (tenant_id, payment_method, status, total) values (${tenantId}, 'efectivo', 'paid', 30) returning id`;
    await sql`insert into payments (order_id, provider, external_id, status, amount, payment_kind) values (${o1.id}, 'mercadopago', 'mp-agg-1', 'approved', 100, 'single')`;
    await sql`insert into payments (order_id, provider, status, amount, payment_kind) values (${o2.id}, 'manual', 'approved', 30, 'single')`;

    const summary = await sql`
      select payment_method, sum(amount_gross) as total, count(*) as movimientos
      from payment_ledger
      where tenant_id = ${tenantId}
      group by payment_method
      order by payment_method`;

    // efectivo 30, mercadopago 100 — exactly the "$X efectivo, $Y MP" the
    // business wants to see.
    const byMethod = Object.fromEntries(
      summary.map((r) => [r.payment_method, Number(r.total)]),
    );
    expect(byMethod).toEqual({ efectivo: 30, mercadopago: 100 });
  });
});
