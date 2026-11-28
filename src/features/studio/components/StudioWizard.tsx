"use client";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { loadDesign } from "../services/studioClientService";
import { useStudioContext } from "./StudioProvider";
import { StudioLoading } from "./StudioLoading";
import { Notification } from "@/components/ui/Notification";
const Workspace = dynamic(() => import("./editor/StudioEditorWorkspace"), {
  ssr: false,
  loading: StudioLoading,
});
export function StudioWizard({
  designId,
  initialReview = false,
  autoAi = false,
  fromAds = false,
}: {
  designId: string;
  initialReview?: boolean;
  autoAi?: boolean;
  fromAds?: boolean;
}) {
  const {
      tenantId,
      isLoading: summaryLoading,
      error: summaryError,
    } = useStudioContext(),
    { data, isLoading, error, mutate } = useSWR(
      ["studio-design", tenantId, designId],
      () => loadDesign(tenantId, designId),
    );
  if (isLoading || summaryLoading) return <StudioLoading />;
  if (error || summaryError || !data)
    return (
      <Notification
        tone="error"
        message={
          error?.message ??
          summaryError?.message ??
          "No encontramos este diseño."
        }
      />
    );
  return (
    <Workspace
      key={data.design.id}
      detail={data}
      onRefresh={() => mutate()}
      initialReview={initialReview}
      autoAi={autoAi}
      fromAds={fromAds}
    />
  );
}
