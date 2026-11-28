"use client";

import { useEffect, useState } from "react";

interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
  openLink: (url: string) => void;
  downloadFile?: (params: { url: string; file_name: string }, callback?: (accepted: boolean) => void) => void;
}

function webApp(): TelegramWebApp | null {
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp ?? null;
}

/** Telegram's Mini App object once its script loaded: signed initData and native links/downloads. */
export function useTelegramWebApp() {
  const [initData, setInitData] = useState<string | null>(null);
  const [outside, setOutside] = useState(false);

  useEffect(() => {
    let tries = 0;
    const timer = window.setInterval(() => {
      const app = webApp();
      tries += 1;
      if (app?.initData) {
        app.ready();
        app.expand();
        setInitData(app.initData);
        window.clearInterval(timer);
      } else if (tries > 40) {
        setOutside(true);
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, []);

  return {
    initData,
    /** Opened in a normal browser instead of Telegram. */
    outside,
    /** wa.me and maps must leave Telegram to open their apps. */
    openExternal: (url: string) => (webApp() ? webApp()?.openLink(url) : window.open(url, "_blank", "noopener")),
    /** Telegram 8+ saves files natively; older clients return false. */
    download: (url: string, fileName: string) => {
      const app = webApp();
      if (!app?.downloadFile) return false;
      app.downloadFile({ url, file_name: fileName });
      return true;
    },
  };
}
