import { describe, it, expect, afterEach } from "vitest";
import { sql } from "@/test/integration/setup";
import { isPlatformAdmin } from "@/lib/auth/isPlatformAdmin";

/**
 * INTEGRATION (S1 super admin): isPlatformAdmin reads the real platform_admins
 * table via the service_role client. Proves the table, its RLS, and the helper
 * work end-to-end against Postgres — the gate for cross-tenant ledger access.
 */
describe("isPlatformAdmin (integration)", () => {
  let userId: string;

  afterEach(async () => {
    if (userId) {
      await sql`delete from platform_admins where user_id = ${userId}`;
      await sql`delete from auth.users where id = ${userId}`;
    }
  });

  async function makeUser(email: string): Promise<string> {
    // Minimal auth.users row (id + email) — enough to satisfy the FK.
    const [u] = await sql`
      insert into auth.users (id, email, aud, role)
      values (gen_random_uuid(), ${email}, 'authenticated', 'authenticated')
      returning id`;
    return u.id;
  }

  it("returns false for a normal user, true once marked platform admin", async () => {
    userId = await makeUser("normal-user@test.local");

    // not an admin yet
    expect(await isPlatformAdmin(userId)).toBe(false);

    // mark as platform admin
    await sql`insert into platform_admins (user_id, note) values (${userId}, 'test')`;
    expect(await isPlatformAdmin(userId)).toBe(true);
  });

  it("returns false for an empty/unknown user id", async () => {
    expect(await isPlatformAdmin("")).toBe(false);
    expect(await isPlatformAdmin("00000000-0000-0000-0000-000000000000")).toBe(false);
  });
});
