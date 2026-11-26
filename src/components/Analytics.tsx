"use client";

import { useEffect } from "react";

type W = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: Record<string, unknown>[];
  plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
};

/**
 * Privacy-conscious event tracking. Listens for clicks on elements with a
 * `data-track` attribute and forwards a cookieless event to whichever
 * analytics provider is present (Plausible, GA4 gtag, or a GTM dataLayer). Does nothing when no
 * provider is configured, and sends no personal data.
 */
export default function Analytics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const event = el.dataset.track!;
      const label = el.getAttribute("href") ?? "";
      const w = window as W;
      w.plausible?.(event, { props: { label } });
      if (w.gtag) w.gtag("event", event, { link_url: label });
      else w.dataLayer?.push({ event, link_url: label });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
