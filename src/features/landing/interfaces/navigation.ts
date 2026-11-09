export interface LandingNavItem {
  label: string;
  href: string;
}
export interface LandingNavProps {
  links?: LandingNavItem[];
  registrationHref?: string;
  registrationLabel?: string;
  loginHref?: string;
}
export interface LandingFooterProps {
  links?: LandingNavItem[];
  closing?: {
    title: string;
    description: string;
    href: string;
    label: string;
    loginHref: string;
    footnote: string;
  };
}
