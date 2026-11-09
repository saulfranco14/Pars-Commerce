import type { Database } from "./database.types";

type PublicTables = Database["public"]["Tables"];
type PublicFunctions = Database["public"]["Functions"];

/** Row shapes of every public table, keyed by name; Studio code reads its own tables through this. */
export type StudioRows = { [K in keyof PublicTables]: PublicTables[K]["Row"] };

type NullableArgs<
  F extends keyof PublicFunctions,
  K extends keyof PublicFunctions[F]["Args"],
> = Omit<PublicFunctions[F], "Args"> & {
  Args: Omit<PublicFunctions[F]["Args"], K> & {
    [P in K]: PublicFunctions[F]["Args"][P] | null;
  };
};

// The SQL handles NULL here (custom campaigns have no source, a placement may run without end); the generator marks them required.
type NullableStudioFunctions = {
  studio_apply_placement: NullableArgs<"studio_apply_placement", "p_end">;
  studio_source_eligible: NullableArgs<"studio_source_eligible", "p_source_id">;
  studio_source_fingerprint: NullableArgs<
    "studio_source_fingerprint",
    "p_source_id"
  >;
};

export type StudioDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Omit<PublicFunctions, keyof NullableStudioFunctions> &
      NullableStudioFunctions;
  };
};
