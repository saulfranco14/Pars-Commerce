import { StudioSourceStep } from "@/features/studio/components/StudioSourceStep";
import type { StudioSourceType } from "@/features/studio/interfaces/studio";
import { uuidSchema } from "@/features/studio/validations/studioSchemas";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; id?: string; quick?: string }>;
}) {
  const q = await searchParams;
  const type = ["product", "promotion", "subscription_plan", "custom"].includes(
    q.source ?? "",
  )
    ? (q.source as StudioSourceType)
    : "product";
  const id = uuidSchema.safeParse(q.id);
  return (
    <StudioSourceStep
      initialSource={type}
      initialId={id.success ? id.data : null}
      quick={q.quick === "1"}
    />
  );
}
