import { CartProvider } from "@/features/sitio/components/cart/CartProvider";
import { HideOnCheckout } from "@/features/sitio/components/shell/HideOnCheckout";
import { StoreFooter } from "@/features/sitio/components/shell/StoreFooter";
import { StoreHeader } from "@/features/sitio/components/shell/StoreHeader";
import { StoreNavigation } from "@/features/sitio/components/shell/StoreNavigation";
import { StoreViewBeacon } from "@/features/sitio/components/shell/StoreViewBeacon";

import { storeSans } from "@/features/sitio/constants/storeFonts";
import { buildStoreThemeStyle } from "@/features/sitio/helpers/storeTheme";

import type { StoreShellProps } from "@/features/sitio/interfaces/storeComponents";

export function StoreShell({ chrome, theme, accent, tenantId, notice, children }: StoreShellProps) {
  return (
    <div
      className={`site-template ${theme.dark ? "site-template-dark" : ""} ${storeSans.variable} flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-(--store-canvas) font-(family-name:--font-store-sans) text-(--store-ink) antialiased`}
      style={buildStoreThemeStyle(theme, accent)}
    >
      <StoreViewBeacon tenantId={tenantId} />
      <StoreNavigation>
        <CartProvider tenantId={tenantId}>
          <StoreHeader chrome={chrome} />
          <main className="site-template-main mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-4 sm:px-6">
            {notice}
            {children}
          </main>
        </CartProvider>
        <HideOnCheckout>
          <StoreFooter chrome={chrome} />
        </HideOnCheckout>
      </StoreNavigation>
    </div>
  );
}
