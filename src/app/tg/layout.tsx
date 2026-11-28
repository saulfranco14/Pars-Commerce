import Script from "next/script";

import type { Metadata } from "next";

import { TELEGRAM_WEB_APP_SCRIPT } from "@/features/growth/constants/miniApp";

export const metadata: Metadata = { title: "Tlaco Ventas", robots: { index: false, follow: false } };

/** Telegram Mini App: no dashboard chrome, and Telegram's script that signs every session. */
export default function MiniAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src={TELEGRAM_WEB_APP_SCRIPT} strategy="afterInteractive" />
      {children}
    </>
  );
}
