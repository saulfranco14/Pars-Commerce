import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SwrProvider } from "@/components/providers/SwrProvider";
import { Analytics } from "@vercel/analytics/next";
import { AuthHashRedirect } from "@/components/auth/AuthHashRedirect";
import { ServiceWorkerFreshnessGuard } from "@/features/qr/components/ServiceWorkerFreshnessGuard";

export const metadata: Metadata = {
  title: "Tlaco",
  description: "Todo tu negocio en un solo lugar: catálogo, pedidos, cobros y tu dinero",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Tlaco",
  },
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  /* Tiñe la barra del navegador. Debe seguir a `--background` de globals.css
     (claro #f7f9fc / oscuro #0a0b0e); antes eran los stone de la marca vieja. */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`,
          }}
        />
        <SwrProvider>
          <AuthHashRedirect />
          <ServiceWorkerFreshnessGuard />
          {children}
          <Analytics />
          <div id="ticket-print-portal" aria-hidden="true" />
        </SwrProvider>
      </body>
    </html>
  );
}
