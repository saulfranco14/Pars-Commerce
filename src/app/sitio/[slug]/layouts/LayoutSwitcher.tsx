import { ClassicLayout } from "./ClassicLayout";
import { MinimalLayout } from "./MinimalLayout";
import { BentoLayout } from "./BentoLayout";
import { DarkLayout } from "./DarkLayout";
import { ElegantLayout } from "./ElegantLayout";
import { BoldLayout } from "./BoldLayout";
import { OrganicLayout } from "./OrganicLayout";
import { IndustrialLayout } from "./IndustrialLayout";
import { VibrantLayout } from "./VibrantLayout";
import type { SiteLayoutProps } from "./layoutTypes";

interface LayoutSwitcherProps extends SiteLayoutProps {
  layoutVariant: string;
}

const LAYOUT_MAP: Record<string, React.ComponentType<SiteLayoutProps>> = {
  classic: ClassicLayout,
  minimal: MinimalLayout,
  bento: BentoLayout,
  dark: DarkLayout,
  elegant: ElegantLayout,
  bold: BoldLayout,
  organic: OrganicLayout,
  industrial: IndustrialLayout,
  vibrant: VibrantLayout,
  clean: MinimalLayout,
};

export function LayoutSwitcher({
  layoutVariant,
  tenant,
  navPages,
  accentColor,
  children,
}: LayoutSwitcherProps) {
  const LayoutComponent =
    LAYOUT_MAP[layoutVariant] ?? ClassicLayout;

  return (
    <LayoutComponent
      tenant={tenant}
      navPages={navPages}
      accentColor={accentColor}
    >
      {children}
    </LayoutComponent>
  );
}
