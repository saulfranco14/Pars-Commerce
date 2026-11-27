import { notFound } from "next/navigation";
import { StudioWizard } from "@/features/studio/components/StudioWizard";
import { uuidSchema } from "@/features/studio/validations/studioSchemas";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<{ compartir?: string; ia?: string }>;
}) {
  const parsed = uuidSchema.safeParse((await params).designId);
  if (!parsed.success) notFound();
  const query = await searchParams;
  return (
    <StudioWizard
      designId={parsed.data}
      initialReview={query.compartir === "1"}
      autoAi={query.ia === "1"}
    />
  );
}
