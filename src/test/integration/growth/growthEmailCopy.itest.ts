import { describe, expect, it } from "vitest";

import { sql } from "@/test/integration/setup";

const INFORMAL = /\b(te|tu|tú|tus|quieres|puedes|actívala)\b/i;

describe("growth formal email copy", () => {
  it("sends every email step in usted with a sign-off", async () => {
    const live = await sql`
      select step, variant, subject, body from growth_templates
      where channel = 'email' and status = 'active' and giro is null and created_by is null
      order by step, variant`;
    expect(live.map((row) => `${row.step}${row.variant}`)).toEqual(["d0A", "d0B", "d0C", "d3A", "d7A"]);
    for (const row of live) {
      expect(row.body.startsWith("Buen día:")).toBe(true);
      expect(row.body.endsWith("{firma}")).toBe(true);
      expect(INFORMAL.test(`${row.subject} ${row.body}`)).toBe(false);
      expect(row.body).not.toContain("{colonia}");
    }
  });

  it("keeps the previous versions archived", async () => {
    const [{ archived }] = await sql`
      select count(*)::int as archived from growth_templates
      where channel = 'email' and status = 'archived' and step = 'd0' and variant = 'A'`;
    expect(archived).toBeGreaterThan(0);
  });
});
