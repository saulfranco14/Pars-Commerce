export interface TicketSettings {
  showLogo?: boolean;
  showBusinessAddress?: boolean;
  showCustomerInfo?: boolean;
  showOrderId?: boolean;
  showDate?: boolean;
  showItems?: boolean;
  showSubtotal?: boolean;
  showDiscount?: boolean;
  showWholesaleSavings?: boolean;
  showPaymentMethod?: boolean;
  footerMessage?: string;
}

export const DEFAULT_TICKET_SETTINGS: TicketSettings = {
  showLogo: false,
  showBusinessAddress: true,
  showCustomerInfo: true,
  showOrderId: true,
  showDate: true,
  showItems: true,
  showSubtotal: true,
  showDiscount: true,
  showWholesaleSavings: true,
  showPaymentMethod: true,
};

export function getDefaultTicketSettings(): TicketSettings {
  return { ...DEFAULT_TICKET_SETTINGS };
}

export function mergeTicketSettings(
  fromTenant: TicketSettings | null | undefined
): TicketSettings {
  const defaults = getDefaultTicketSettings();
  if (!fromTenant || typeof fromTenant !== "object") return defaults;
  return {
    ...defaults,
    ...fromTenant,
  };
}
