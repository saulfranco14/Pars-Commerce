import type { ReactNode } from "react";
import { NavigationFeedback } from "@/components/navigation/NavigationFeedback";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <NavigationFeedback>{children}</NavigationFeedback>;
}
