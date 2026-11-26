"use client";

import { useEffect } from "react";

type W = Window & {
  gtag?: (...args: unknown[]) => void;
  plausible?: (event: string, opts?: { props?: Record<string, string> }) => void;
};

/**
 * Privacy-conscious event tracking. Listens for clicks on elements with a
 * `data-track` attribute and forwards a cookieless event to whichever
 * analytics provider is present (Plausible or GA4). Does nothing when no
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
      w.gtag?.("event", event, { link_url: label });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
