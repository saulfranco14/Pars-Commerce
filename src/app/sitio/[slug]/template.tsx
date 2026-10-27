import type { SitioTemplateProps } from "@/features/sitio/interfaces/storeNavigation";

export default function SitioTemplate({ children }: SitioTemplateProps) {
  return <div className="store-page-enter">{children}</div>;
}
