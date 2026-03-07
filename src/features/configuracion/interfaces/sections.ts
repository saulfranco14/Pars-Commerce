import type { ReactNode } from "react";
import type {
  SitePage,
  SitePageContent,
  SitePageCard,
} from "@/types/tenantSitePages";

export interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export interface ConfigFinanzasSectionProps {
  monthlyRent: string;
  onMonthlyRentChange: (v: string) => void;
  monthlySalesObjective: string;
  onMonthlySalesObjectiveChange: (v: string) => void;
}

export interface ConfigDireccionSectionProps {
  street: string;
  onStreetChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  state: string;
  onStateChange: (v: string) => void;
  postalCode: string;
  onPostalCodeChange: (v: string) => void;
  country: string;
  onCountryChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
}

export interface ConfigNegocioSectionProps {
  tenantId: string;
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  logoUrl: string | null;
  onLogoChange: (v: string | null) => void;
  logoError?: string | null;
  logoSaving?: boolean;
  expressOrderEnabled: boolean;
  onExpressOrderChange: (v: boolean) => void;
}

export interface ConfigTicketSectionProps {
  showLogo: boolean;
  onShowLogoChange: (v: boolean) => void;
  showBusinessAddress: boolean;
  onShowBusinessAddressChange: (v: boolean) => void;
  showCustomerInfo: boolean;
  onShowCustomerInfoChange: (v: boolean) => void;
  showOrderId: boolean;
  onShowOrderIdChange: (v: boolean) => void;
  showDate: boolean;
  onShowDateChange: (v: boolean) => void;
  showItems: boolean;
  onShowItemsChange: (v: boolean) => void;
  showSubtotal: boolean;
  onShowSubtotalChange: (v: boolean) => void;
  showDiscount: boolean;
  onShowDiscountChange: (v: boolean) => void;
  showWholesaleSavings: boolean;
  onShowWholesaleSavingsChange: (v: boolean) => void;
  showPaymentMethod: boolean;
  onShowPaymentMethodChange: (v: boolean) => void;
  footerMessage: string;
  onFooterMessageChange: (v: string) => void;
}

export interface SiteContentFormProps {
  tenantId: string;
  tenantSlug: string;
  sitePages: SitePage[];
  onContentSaved?: () => void;
  embedded?: boolean;
}

export interface SiteContentTabProps {
  tenantId: string;
  content: SitePageContent;
  onChange: (c: SitePageContent) => void;
  onSave: () => void;
  loading: boolean;
  narrow?: boolean;
}

export interface CardIconSelectorProps {
  value: SitePageCard["icon"] | undefined;
  onChange: (icon: SitePageCard["icon"]) => void;
  id?: string;
}
