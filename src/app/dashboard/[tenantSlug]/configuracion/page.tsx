"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useTenantStore } from "@/stores/useTenantStore";
import type { MembershipItem } from "@/stores/useTenantStore";
import {
  update as updateTenant,
  list as listTenants,
} from "@/services/tenantsService";
import {
  type TicketSettings,
  mergeTicketSettings,
} from "@/types/ticketSettings";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { FormSaveBar } from "@/components/layout/FormSaveBar";
import { ConfigNegocioSection } from "./components/ConfigNegocioSection";
import { ConfigTicketSection } from "./components/ConfigTicketSection";
import { ConfigFinanzasSection } from "./components/ConfigFinanzasSection";
import { ConfigDireccionSection } from "./components/ConfigDireccionSection";

const CONFIG_TABS = [
  { value: "negocio", label: "Negocio" },
  { value: "ticket", label: "Ticket" },
  { value: "finanzas", label: "Finanzas" },
  { value: "direccion", label: "Dirección" },
] as const;

type ConfigTab = (typeof CONFIG_TABS)[number]["value"];

export default function ConfiguracionPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const setMemberships = useTenantStore((s) => s.setMemberships);
  const [activeTab, setActiveTab] = useState<ConfigTab>("negocio");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expressOrderEnabled, setExpressOrderEnabled] = useState(false);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressCountry, setAddressCountry] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [monthlySalesObjective, setMonthlySalesObjective] = useState("");
  const [ticketShowLogo, setTicketShowLogo] = useState(false);
  const [ticketShowBusinessAddress, setTicketShowBusinessAddress] =
    useState(true);
  const [ticketShowCustomerInfo, setTicketShowCustomerInfo] = useState(true);
  const [ticketShowOrderId, setTicketShowOrderId] = useState(true);
  const [ticketShowDate, setTicketShowDate] = useState(true);
  const [ticketShowItems, setTicketShowItems] = useState(true);
  const [ticketShowSubtotal, setTicketShowSubtotal] = useState(true);
  const [ticketShowDiscount, setTicketShowDiscount] = useState(true);
  const [ticketShowWholesaleSavings, setTicketShowWholesaleSavings] =
    useState(true);
  const [ticketShowPaymentMethod, setTicketShowPaymentMethod] = useState(true);
  const [ticketFooterMessage, setTicketFooterMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeTenant) return;
    setName(activeTenant.name ?? "");
    setDescription(activeTenant.description ?? "");
    const st = activeTenant.settings as
      | Record<string, unknown>
      | null
      | undefined;
    setExpressOrderEnabled(st?.express_order_enabled === true);
    const ticket = mergeTicketSettings(
      st?.ticket as TicketSettings | undefined,
    );
    setTicketShowLogo(ticket.showLogo ?? false);
    setTicketShowBusinessAddress(ticket.showBusinessAddress ?? true);
    setTicketShowCustomerInfo(ticket.showCustomerInfo ?? true);
    setTicketShowOrderId(ticket.showOrderId ?? true);
    setTicketShowDate(ticket.showDate ?? true);
    setTicketShowItems(ticket.showItems ?? true);
    setTicketShowSubtotal(ticket.showSubtotal ?? true);
    setTicketShowDiscount(ticket.showDiscount ?? true);
    setTicketShowWholesaleSavings(ticket.showWholesaleSavings ?? true);
    setTicketShowPaymentMethod(ticket.showPaymentMethod ?? true);
    setTicketFooterMessage(ticket.footerMessage ?? "");
    const addr = activeTenant.address;
    setAddressStreet(addr?.street ?? "");
    setAddressCity(addr?.city ?? "");
    setAddressState(addr?.state ?? "");
    setAddressPostalCode(addr?.postal_code ?? "");
    setAddressCountry(addr?.country ?? "");
    setAddressPhone(addr?.phone ?? "");
    const sc = activeTenant.sales_config;
    setMonthlyRent(sc?.monthly_rent != null ? String(sc.monthly_rent) : "");
    setMonthlySalesObjective(
      sc?.monthly_sales_objective != null
        ? String(sc.monthly_sales_objective)
        : "",
    );
  }, [activeTenant?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!activeTenant) {
      setError("No hay negocio seleccionado");
      return;
    }
    setLoading(true);
    try {
      await updateTenant(activeTenant.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        settings: {
          ...((activeTenant.settings as Record<string, unknown>) ?? {}),
          express_order_enabled: expressOrderEnabled,
          express_orders: expressOrderEnabled,
          ticket: {
            showLogo: ticketShowLogo,
            showBusinessAddress: ticketShowBusinessAddress,
            showCustomerInfo: ticketShowCustomerInfo,
            showOrderId: ticketShowOrderId,
            showDate: ticketShowDate,
            showItems: ticketShowItems,
            showSubtotal: ticketShowSubtotal,
            showDiscount: ticketShowDiscount,
            showWholesaleSavings: ticketShowWholesaleSavings,
            showPaymentMethod: ticketShowPaymentMethod,
            footerMessage: ticketFooterMessage.trim() || undefined,
          },
        },
        address: {
          street: addressStreet.trim() || undefined,
          city: addressCity.trim() || undefined,
          state: addressState.trim() || undefined,
          postal_code: addressPostalCode.trim() || undefined,
          country: addressCountry.trim() || undefined,
          phone: addressPhone.trim() || undefined,
        },
        monthly_rent: (() => {
          const n = parseFloat(monthlyRent);
          return monthlyRent !== "" && !Number.isNaN(n) ? n : undefined;
        })(),
        monthly_sales_objective: (() => {
          const n = parseFloat(monthlySalesObjective);
          return monthlySalesObjective !== "" && !Number.isNaN(n)
            ? n
            : undefined;
        })(),
      });
      setSuccess(true);
      const list = (await listTenants()) as MembershipItem[];
      setMemberships(list ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-0 max-w-4xl flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-4 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-(--touch-target,44px) items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver al inicio
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Configuración
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Datos del negocio, dirección y finanzas. Para tienda pública, redes
            y contenido del sitio web, usa Sitio web.
          </p>
        </div>
        <FilterTabs
          tabs={CONFIG_TABS}
          activeValue={activeTab}
          onTabChange={(v) => setActiveTab(v as ConfigTab)}
          ariaLabel="Secciones de configuración"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm">
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden md:pb-0 mb-4"
        >
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-8 sm:p-6 sm:pb-8">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 alert-success">
                Cambios guardados.
              </div>
            )}

            {activeTab === "negocio" && (
              <ConfigNegocioSection
                name={name}
                onNameChange={setName}
                description={description}
                onDescriptionChange={setDescription}
                expressOrderEnabled={expressOrderEnabled}
                onExpressOrderChange={setExpressOrderEnabled}
              />
            )}
            {activeTab === "ticket" && (
              <ConfigTicketSection
                showLogo={ticketShowLogo}
                onShowLogoChange={setTicketShowLogo}
                showBusinessAddress={ticketShowBusinessAddress}
                onShowBusinessAddressChange={setTicketShowBusinessAddress}
                showCustomerInfo={ticketShowCustomerInfo}
                onShowCustomerInfoChange={setTicketShowCustomerInfo}
                showOrderId={ticketShowOrderId}
                onShowOrderIdChange={setTicketShowOrderId}
                showDate={ticketShowDate}
                onShowDateChange={setTicketShowDate}
                showItems={ticketShowItems}
                onShowItemsChange={setTicketShowItems}
                showSubtotal={ticketShowSubtotal}
                onShowSubtotalChange={setTicketShowSubtotal}
                showDiscount={ticketShowDiscount}
                onShowDiscountChange={setTicketShowDiscount}
                showWholesaleSavings={ticketShowWholesaleSavings}
                onShowWholesaleSavingsChange={setTicketShowWholesaleSavings}
                showPaymentMethod={ticketShowPaymentMethod}
                onShowPaymentMethodChange={setTicketShowPaymentMethod}
                footerMessage={ticketFooterMessage}
                onFooterMessageChange={setTicketFooterMessage}
              />
            )}
            {activeTab === "finanzas" && (
              <ConfigFinanzasSection
                monthlyRent={monthlyRent}
                onMonthlyRentChange={setMonthlyRent}
                monthlySalesObjective={monthlySalesObjective}
                onMonthlySalesObjectiveChange={setMonthlySalesObjective}
              />
            )}
            {activeTab === "direccion" && (
              <ConfigDireccionSection
                street={addressStreet}
                onStreetChange={setAddressStreet}
                city={addressCity}
                onCityChange={setAddressCity}
                state={addressState}
                onStateChange={setAddressState}
                postalCode={addressPostalCode}
                onPostalCodeChange={setAddressPostalCode}
                country={addressCountry}
                onCountryChange={setAddressCountry}
                phone={addressPhone}
                onPhoneChange={setAddressPhone}
              />
            )}
          </div>
          <FormSaveBar>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 md:w-auto md:min-w-[140px]"
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </FormSaveBar>
        </form>
      </div>
    </div>
  );
}
