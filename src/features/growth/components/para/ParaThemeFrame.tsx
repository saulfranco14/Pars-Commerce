import { storeSans } from "@/features/sitio/constants/storeFonts";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { buildStoreThemeStyle, resolveStoreTheme } from "@/features/sitio/helpers/storeTheme";

/** The storefront's default theme tokens (--store-*), so «Para ti» blocks look like the real store. */
export function ParaThemeFrame({ children }: { children: React.ReactNode }) {
  const theme = resolveStoreTheme(null);
  return (
    <div
      className={`site-template ${theme.dark ? "site-template-dark" : ""} ${storeSans.variable} min-w-0 overflow-x-clip bg-(--store-canvas) font-(family-name:--font-store-sans) text-(--store-ink) antialiased`}
      style={buildStoreThemeStyle(theme, DEFAULT_TENANT_ACCENT)}
    >
      {children}
    </div>
  );
}
