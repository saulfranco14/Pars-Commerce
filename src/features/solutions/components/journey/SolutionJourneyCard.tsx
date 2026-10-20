"use client";

import { JourneyCheckoutView } from "@/features/solutions/components/journey/JourneyCheckoutView";
import { JourneyCustomerView } from "@/features/solutions/components/journey/JourneyCustomerView";
import { JourneyOrdersView } from "@/features/solutions/components/journey/JourneyOrdersView";
import { useSolutionJourney } from "@/features/solutions/hooks/useSolutionJourney";

import { JOURNEY_TABS } from "@/features/solutions/constants/solutionCapabilities";

import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";

/** Una venta completa en tres vistas: el cliente compra, el negocio atiende, se cobra. */
export function SolutionJourneyCard({
  solution,
  name,
  setName,
  themeColor,
}: {
  solution: SolutionDefinition;
  name: string;
  setName: (value: string) => void;
  themeColor: string;
}) {
  const j = useSolutionJourney(solution);

  return (
    <div id="recorrido" className="min-w-0 scroll-mt-20 rounded-[1.75rem] border border-border bg-surface-raised p-2 shadow-card sm:p-3">
      <div className="overflow-hidden rounded-[1.35rem] border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="focused-store-name" className="block text-[11px] font-semibold text-muted-foreground">
                Prueba con el nombre de tu negocio
              </label>
              <input
                id="focused-store-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                autoComplete="organization"
                className="mt-0.5 h-8 w-full max-w-xs rounded-lg border border-transparent bg-transparent px-1 text-sm font-semibold text-foreground outline-none hover:border-border focus:border-accent"
              />
            </div>
            <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 sm:inline-flex dark:text-emerald-400">
              Operación conectada
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-border-soft p-1 dark:bg-border" role="tablist" aria-label="Recorrido de venta">
            {JOURNEY_TABS.map((tab, index) => {
              const active = j.journey === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => j.goToJourney(tab.id)}
                  className={`flex min-h-12 cursor-pointer items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold leading-tight sm:px-3 sm:text-xs ${
                    active ? "bg-surface text-foreground shadow-card" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      active ? "bg-accent text-accent-foreground" : "bg-surface text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-h-98 sm:min-h-103">
          {j.journey === "customer" && (
            <JourneyCustomerView
              name={name}
              themeColor={themeColor}
              heroImage={solution.heroImage}
              featuredItems={j.featuredItems}
              quantityOf={j.quantityOf}
              changeQuantity={j.changeQuantity}
              cartLines={j.cartLines}
              cartCount={j.cartCount}
              total={j.total}
              submitOrder={j.submitOrder}
            />
          )}
          {j.journey === "orders" && (
            <JourneyOrdersView
              stage={j.stage}
              cartLines={j.cartLines}
              cartCount={j.cartCount}
              total={j.total}
              advanceOrder={j.advanceOrder}
            />
          )}
          {j.journey === "checkout" && (
            <JourneyCheckoutView
              stage={j.stage}
              total={j.total}
              cartCount={j.cartCount}
              paymentMethod={j.paymentMethod}
              setPaymentMethod={j.setPaymentMethod}
              chargeOrder={j.chargeOrder}
              resetJourney={j.resetJourney}
            />
          )}
        </div>
      </div>
    </div>
  );
}
