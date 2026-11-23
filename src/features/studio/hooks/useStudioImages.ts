"use client";
import useSWR from "swr";
import { useStudioContext } from "../components/StudioProvider";
import { loadStudioImages } from "../services/studioClientService";

/** Every image the AI made for this business, newest first. */
export function useStudioImages() {
  const { tenantId } = useStudioContext();
  const images = useSWR(["studio-images", tenantId], () =>
    loadStudioImages(tenantId),
  );
  return {
    images: images.data ?? [],
    isLoading: images.isLoading,
    refresh: images.mutate,
  };
}
