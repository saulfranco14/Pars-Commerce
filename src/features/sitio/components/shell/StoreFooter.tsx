import Link from "next/link";

import { FacebookIcon } from "@/features/sitio/components/icons/FacebookIcon";
import { InstagramIcon } from "@/features/sitio/components/icons/InstagramIcon";
import { TwitterIcon } from "@/features/sitio/components/icons/TwitterIcon";
import { WhatsAppIcon } from "@/features/sitio/components/icons/WhatsAppIcon";

import { whatsappHref } from "@/features/sitio/helpers/storeLinks";

import type { StoreChrome } from "@/features/sitio/interfaces/storefront";

const FOOTER_LINK =
  "inline-flex min-h-9 items-center gap-2 text-[13px] text-(--store-ink-2) transition-colors hover:text-(--store-ink)";

export function StoreFooter({ chrome }: { chrome: StoreChrome }) {
  const contacts = [
    chrome.whatsappPhone
      ? { label: "WhatsApp", href: whatsappHref(chrome.whatsappPhone), Icon: WhatsAppIcon }
      : null,
    chrome.socialLinks.instagram
      ? { label: "Instagram", href: chrome.socialLinks.instagram, Icon: InstagramIcon }
      : null,
    chrome.socialLinks.facebook
      ? { label: "Facebook", href: chrome.socialLinks.facebook, Icon: FacebookIcon }
      : null,
    chrome.socialLinks.twitter
      ? { label: "X", href: chrome.socialLinks.twitter, Icon: TwitterIcon }
      : null,
  ].filter((contact) => contact !== null);

  return (
    <footer className="mt-auto border-t border-(--store-hairline) bg-(--store-canvas)">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-[1.6fr_1fr_1fr]">
          <div className="max-w-sm">
            <p className="text-[15px] font-semibold text-(--store-ink)">{chrome.tenantName}</p>
            {chrome.tenantDescription ? (
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-(--store-ink-2)">
                {chrome.tenantDescription}
              </p>
            ) : null}
          </div>
          <div>
            <h2 className="text-xs font-semibold text-(--store-ink)">Tienda</h2>
            <ul className="mt-2">
              {chrome.navLinks.map((link) => (
                <li key={link.id}>
                  <Link href={link.href} className={FOOTER_LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {contacts.length > 0 ? (
            <div>
              <h2 className="text-xs font-semibold text-(--store-ink)">Contacto</h2>
              <ul className="mt-2">
                {contacts.map(({ label, href, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>
                      <Icon />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <p className="mt-10 border-t border-(--store-hairline) pt-5 text-xs text-(--store-ink-2)">
          © {new Date().getFullYear()} {chrome.tenantName}
        </p>
      </div>
    </footer>
  );
}
