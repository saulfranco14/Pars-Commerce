import { notFound } from "next/navigation";
import { StudioWizard } from "@/features/studio/components/StudioWizard";
import { uuidSchema } from "@/features/studio/validations/studioSchemas";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ designId: string }>;
  searchParams: Promise<{ compartir?: string }>;
}) {
  const parsed = uuidSchema.safeParse((await params).designId);
  if (!parsed.success) notFound();
  return (
    <StudioWizard
      designId={parsed.data}
      initialReview={(await searchParams).compartir === "1"}
    />
  );
}
