"use client";
import dynamic from "next/dynamic";
import { StudioLoading } from "./StudioLoading";

const Workspace = dynamic(() => import("./editor/StudioLabWorkspace"), {
  ssr: false,
  loading: () => <StudioLoading />,
});

export function StudioLab() {
  return <Workspace />;
}
