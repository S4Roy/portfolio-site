"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const KEY = "scroll-positions";

function read(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

/**
 * Restores the scroll position on browser Back/Forward. The browser's native restoration
 * runs before the previous page has re-rendered, so on a taller page (e.g. returning from
 * /blog to the home page) it gets clamped to the shorter page's height. Here positions are
 * saved per path and re-applied after the new route has rendered. Forward navigations
 * (link clicks) are left to Next.js, which scrolls to the top.
 */
export default function ScrollRestoration() {
  const pathname = usePathname();
  const popped = useRef(false);

  useEffect(() => {
    history.scrollRestoration = "manual";
    const onPop = () => (popped.current = true);
    let t: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const all = read();
        all[location.pathname] = scrollY;
        try {
          sessionStorage.setItem(KEY, JSON.stringify(all));
        } catch {}
      }, 120);
    };
    // Plain in-page anchors (<a href="#id">: blog TOC, heading permalinks, skip link) make the
    // browser push a history entry WITHOUT Next.js router state. Navigating Back to such an
    // entry from another route then changes the URL but never re-renders the page. Handle those
    // clicks here and copy the current router state into the new entry.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[href^='#']");
      if (!a || a.target === "_blank") return;
      const id = decodeURIComponent(a.hash.slice(1));
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      if (location.hash !== a.hash) history.pushState(history.state, "", a.hash);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (id === "main") {
        el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true }); // keep skip-link keyboard behaviour
      }
    };
    addEventListener("popstate", onPop);
    addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      removeEventListener("popstate", onPop);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!popped.current) return;
    popped.current = false;
    const y = read()[pathname];
    if (y === undefined) return;
    // Wait for the restored route to lay out, then jump (no smooth animation).
    requestAnimationFrame(() =>
      requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior })),
    );
  }, [pathname]);

  return null;
}
