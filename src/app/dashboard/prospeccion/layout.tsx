"use client";

import { NavigationFeedback } from "@/components/navigation/NavigationFeedback";
import { ProspectingGate } from "@/features/growth/components/admin/ProspectingGate";

export default function ProspeccionLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationFeedback>
      <div className="press-feedback contents">
        <ProspectingGate>{children}</ProspectingGate>
      </div>
    </NavigationFeedback>
  );
}
