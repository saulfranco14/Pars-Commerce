import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { listPlatformUsers, parseUserQuery, usersCsv } from "@/features/platform/services/platformUsersService";

/** Filters, sorting and paging happen in SQL (platform_users_overview); `format=csv` exports every match. */
export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const params = new URL(request.url).searchParams;
  const query = parseUserQuery(params);
  const csv = params.get("format") === "csv";
  const result = await listPlatformUsers(createAdminClient(), gate.user.id, csv ? { ...query, page: 1, perPage: 5000 } : query);
  if (!result.ok) return serviceErrorToResponse(result.error);
  if (!csv) return NextResponse.json(result.data);
  return new NextResponse(`\uFEFF${usersCsv(result.data.users)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="usuarios-tlaco-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
