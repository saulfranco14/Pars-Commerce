import { Plus_Jakarta_Sans } from "next/font/google";

// Self-hosted by next/font at build time; scoped to the public storefront only.
export const storeSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-store-sans",
});
