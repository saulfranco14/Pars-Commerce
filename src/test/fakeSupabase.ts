/**
 * Fake Supabase client for UNIT tests.
 *
 * The payment/order services receive their client by parameter
 * (`admin: SupabaseClient`) and return a pure `ServiceResult<T>`, so a test
 * can hand them this fake instead of a real client — no network, no DB, no
 * RLS. Runs in milliseconds.
 *
 * What it does:
 *  - READS: you seed rows per table; `.eq()/.neq()/.in()/.is()` filter that
 *    seeded set; `.single()/.maybeSingle()` (or awaiting the builder) return
 *    the filtered rows the way Postgrest would (`{ data, error }`).
 *  - WRITES: `.insert()/.update()/.delete()/.upsert()` are RECORDED in
 *    `client.writes` so a test can assert "confirmPayment marked the group
 *    paid" without a real DB. They also mutate the in-memory seed so a
 *    read-after-write in the same service sees the change.
 *
 * IMPORTANT: this file lives only under src/test and is imported ONLY by
 * *.test.ts. It never ships to production and is not in the app bundle.
 *
 * It intentionally implements just the chain surface the services actually
 * use (from/select/insert/update/delete/upsert + eq/neq/in/is/order/limit +
 * single/maybeSingle). Add a method here only when a service under test
 * genuinely calls it — don't pad it with unused API.
 */

type Row = Record<string, unknown>;

export interface RecordedWrite {
  table: string;
  op: "insert" | "update" | "delete" | "upsert";
  /** Payload for insert/update/upsert. Undefined for delete. */
  values?: Row | Row[];
  /** Filters applied via .eq()/.neq()/.in()/.is() before the write ran. */
  filters: Array<{ op: string; column: string; value: unknown }>;
}

type Filter = { op: "eq" | "neq" | "in" | "is"; column: string; value: unknown };

function matches(row: Row, filters: Filter[]): boolean {
  return filters.every((f) => {
    const v = row[f.column];
    switch (f.op) {
      case "eq":
        return v === f.value;
      case "neq":
        return v !== f.value;
      case "in":
        return Array.isArray(f.value) && f.value.includes(v);
      case "is":
        return v === f.value; // .is(col, null) → v === null
      default:
        return true;
    }
  });
}

/**
 * A thenable query builder. Awaiting it (or calling .single/.maybeSingle)
 * resolves to a Postgrest-shaped `{ data, error }`. For writes, the recording
 * happens at the moment the terminal (insert/update/delete/upsert) is called.
 */
class FakeQuery implements PromiseLike<{ data: unknown; error: unknown }> {
  private filters: Filter[] = [];
  private pendingWrite: RecordedWrite | null = null;
  private limitN: number | null = null;

  constructor(
    private table: string,
    private store: Map<string, Row[]>,
    private writes: RecordedWrite[],
  ) {}

  private rows(): Row[] {
    return this.store.get(this.table) ?? [];
  }

  // ---- filters (chainable) ----
  eq(column: string, value: unknown) {
    this.filters.push({ op: "eq", column, value });
    return this;
  }
  neq(column: string, value: unknown) {
    this.filters.push({ op: "neq", column, value });
    return this;
  }
  in(column: string, value: unknown[]) {
    this.filters.push({ op: "in", column, value });
    return this;
  }
  is(column: string, value: unknown) {
    this.filters.push({ op: "is", column, value });
    return this;
  }
  order(..._args: unknown[]) {
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  select(..._args: unknown[]) {
    // For writes, `.select()` after insert/update just returns the builder so
    // the caller can `.single()` the written row back. For reads it's a no-op
    // (we return whole rows; column projection isn't enforced in unit tests).
    return this;
  }

  // ---- write terminals (record + mutate in-memory) ----
  insert(values: Row | Row[]) {
    this.pendingWrite = { table: this.table, op: "insert", values, filters: [] };
    this.writes.push(this.pendingWrite);
    const arr = this.rows().slice();
    for (const v of Array.isArray(values) ? values : [values]) arr.push({ ...v });
    this.store.set(this.table, arr);
    return this;
  }
  update(values: Row) {
    this.pendingWrite = {
      table: this.table,
      op: "update",
      values,
      filters: this.filters,
    };
    return this; // recording finalized on terminal resolve (filters may still be added)
  }
  delete() {
    this.pendingWrite = {
      table: this.table,
      op: "delete",
      filters: this.filters,
    };
    return this;
  }
  upsert(values: Row | Row[]) {
    this.pendingWrite = { table: this.table, op: "upsert", values, filters: [] };
    this.writes.push(this.pendingWrite);
    return this;
  }

  private finalizeWrite() {
    if (!this.pendingWrite) return;
    // update/delete had their filters populated after the terminal call.
    if (this.pendingWrite.op === "update") {
      this.pendingWrite.filters = this.filters.slice();
      this.writes.push(this.pendingWrite);
      const updated = this.rows().map((r) =>
        matches(r, this.filters)
          ? { ...r, ...(this.pendingWrite!.values as Row) }
          : r,
      );
      this.store.set(this.table, updated);
    } else if (this.pendingWrite.op === "delete") {
      this.pendingWrite.filters = this.filters.slice();
      this.writes.push(this.pendingWrite);
      this.store.set(
        this.table,
        this.rows().filter((r) => !matches(r, this.filters)),
      );
    }
    this.pendingWrite = null;
  }

  // ---- read terminals ----
  private resolveList(): { data: Row[]; error: null } {
    this.finalizeWrite();
    let data = this.rows().filter((r) => matches(r, this.filters));
    if (this.limitN != null) data = data.slice(0, this.limitN);
    return { data, error: null };
  }

  single(): Promise<{ data: Row | null; error: unknown }> {
    const { data } = this.resolveList();
    if (data.length === 0)
      return Promise.resolve({ data: null, error: { message: "no rows" } });
    return Promise.resolve({ data: data[0], error: null });
  }
  maybeSingle(): Promise<{ data: Row | null; error: null }> {
    const { data } = this.resolveList();
    return Promise.resolve({ data: data[0] ?? null, error: null });
  }

  then<R1 = { data: unknown; error: unknown }, R2 = never>(
    onfulfilled?:
      | ((v: { data: unknown; error: unknown }) => R1 | PromiseLike<R1>)
      | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return Promise.resolve(this.resolveList()).then(onfulfilled, onrejected);
  }
}

export interface FakeSupabase {
  from(table: string): FakeQuery;
  /** Every write (insert/update/delete/upsert) recorded, in call order. */
  writes: RecordedWrite[];
  /** Current in-memory rows for a table (post-writes) — for assertions. */
  rowsOf(table: string): Row[];
}

/**
 * Build a fake client. Seed with the rows each table should return on read:
 *   const db = createFakeSupabase({ payments: [{ id: "p1", status: "pending" }] });
 *   const res = await confirmPayment(db as unknown as SupabaseClient, { ... });
 *   expect(db.writes).toContainEqual(...);
 */
export function createFakeSupabase(seed: Record<string, Row[]> = {}): FakeSupabase {
  const store = new Map<string, Row[]>(
    Object.entries(seed).map(([t, rows]) => [t, rows.map((r) => ({ ...r }))]),
  );
  const writes: RecordedWrite[] = [];
  return {
    from(table: string) {
      return new FakeQuery(table, store, writes);
    },
    writes,
    rowsOf(table: string) {
      return store.get(table) ?? [];
    },
  };
}
