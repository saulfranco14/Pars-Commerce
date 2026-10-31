/* eslint-disable @typescript-eslint/no-explicit-any -- assisted tables ship in the paired migration. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/app/api/platform/_lib";
import { createAdminClient } from "@/lib/supabase/admin";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { provisionAssistedOnboarding } from "@/features/onboarding/services/assistedOnboardingService";

import type { AssistedOnboardingInput } from "@/features/onboarding/interfaces/assistedOnboarding";

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const body = await request.json() as AssistedOnboardingInput;
  const admin = createAdminClient() as unknown as SupabaseClient<any>;
  const result = await provisionAssistedOnboarding(admin, gate.user.id, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data, { status: 201 });
}

export async function GET() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const admin = createAdminClient() as unknown as SupabaseClient<any>;
  const { data, error } = await admin.from("assisted_onboardings").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
