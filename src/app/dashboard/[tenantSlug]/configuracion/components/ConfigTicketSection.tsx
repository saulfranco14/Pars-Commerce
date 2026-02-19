"use client";

interface ConfigTicketSectionProps {
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

const checkboxItemClass =
  "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg py-2 pr-2 pl-2 hover:bg-border-soft/40";

function CheckItem({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className={checkboxItemClass}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-border accent-accent mt-0.5"
      />
      <span className="text-sm text-muted-foreground leading-tight">{label}</span>
    </label>
  );
}

export function ConfigTicketSection(props: ConfigTicketSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-snug">
        Configura qué se muestra al imprimir o descargar el ticket.
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <CheckItem
          checked={props.showLogo}
          onChange={props.onShowLogoChange}
          label="Mostrar logo"
        />
        <CheckItem
          checked={props.showBusinessAddress}
          onChange={props.onShowBusinessAddressChange}
          label="Mostrar dirección del negocio"
        />
        <CheckItem
          checked={props.showCustomerInfo}
          onChange={props.onShowCustomerInfoChange}
          label="Mostrar datos del cliente"
        />
        <CheckItem
          checked={props.showOrderId}
          onChange={props.onShowOrderIdChange}
          label="Mostrar número de orden"
        />
        <CheckItem
          checked={props.showDate}
          onChange={props.onShowDateChange}
          label="Mostrar fecha y hora"
        />
        <CheckItem
          checked={props.showItems}
          onChange={props.onShowItemsChange}
          label="Mostrar lista de productos"
        />
        <CheckItem
          checked={props.showSubtotal}
          onChange={props.onShowSubtotalChange}
          label="Mostrar subtotal"
        />
        <CheckItem
          checked={props.showDiscount}
          onChange={props.onShowDiscountChange}
          label="Mostrar descuento"
        />
        <CheckItem
          checked={props.showWholesaleSavings}
          onChange={props.onShowWholesaleSavingsChange}
          label="Mostrar ahorro mayoreo"
        />
        <CheckItem
          checked={props.showPaymentMethod}
          onChange={props.onShowPaymentMethodChange}
          label="Mostrar forma de pago"
        />
      </div>
      <div className="pt-1">
        <label
          htmlFor="config-ticket-footer"
          className="block text-sm font-medium text-muted-foreground"
        >
          Mensaje de pie (opcional)
        </label>
        <input
          id="config-ticket-footer"
          type="text"
          value={props.footerMessage}
          onChange={(e) => props.onFooterMessageChange(e.target.value)}
          className="input-form mt-1 block w-full min-h-10 rounded-lg border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          placeholder="Ej. Gracias por tu compra"
        />
      </div>
    </div>
  );
}
