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
  "flex min-h-(--touch-target,44px) cursor-pointer items-center gap-3 rounded-lg px-3 py-2 -mx-1 hover:bg-border-soft/40";
const inputClass =
  "input-form mt-1 block w-full min-h-(--touch-target,44px) rounded-lg border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

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
        className="h-5 w-5 shrink-0 rounded border-border accent-accent"
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </label>
  );
}

export function ConfigTicketSection(props: ConfigTicketSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configura qué se muestra al imprimir o descargar el ticket.
      </p>
      <div className="space-y-1 -mx-1">
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
      <div>
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
          className={inputClass}
          placeholder="Ej. Gracias por tu compra"
        />
      </div>
    </div>
  );
}
