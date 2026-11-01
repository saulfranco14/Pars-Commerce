import { NextResponse } from "next/server";
import { ValidationError } from "yup";

import { readJson } from "@/lib/readJson";
import { requireGrowthMember } from "@/app/api/growth/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { writeTodayPlan } from "@/features/growth/services/tlacoAiService";
import { todayPlanSchema } from "@/features/growth/validations/tlacoAiSchemas";

export async function POST(request: Request) {
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  try {
    const facts = await todayPlanSchema.validate((await readJson(request)) ?? {}, { stripUnknown: true });
    const result = await writeTodayPlan(facts);
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
