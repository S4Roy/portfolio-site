"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { resumePath } from "@/lib/data";
import { Close, Download, Menu, Moon, Sun } from "@/components/icons";

const links = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

function ThemeToggle() {
  const toggle = () => {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted transition-colors hover:text-foreground"
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </button>
  );
}

export default function Nav({ home = true }: { home?: boolean }) {
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!home) return;
    const sections = links.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [home]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Always route through Next.js <Link> so history entries keep router state (Back/Forward safe).
  const href = (id: string) => `/#${id}`;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href={href("home")} className="text-sm font-semibold tracking-tight">
          Subhankar Roy
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1 text-sm">
            {links.map((l) => {
              const isActive = home && active === l.id;
              return (
                <li key={l.id}>
                  <Link
                    href={href(l.id)}
                    aria-current={isActive ? "location" : undefined}
                    className={`rounded-md px-3 py-1.5 transition-colors ${
                      isActive ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={resumePath}
            download
            data-track="resume_download"
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent sm:inline-flex"
          >
            <Download /> Resume
          </a>
          <Link
            href={href("contact")}
            data-track="hire_me_click"
            className="hidden h-9 items-center rounded-lg bg-accent px-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong dark:text-[#0a0f1a] sm:inline-flex"
          >
            Hire me
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-border bg-background lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-5 py-3 sm:px-8">
            {links.map((l) => (
              <li key={l.id}>
                <Link
                  href={href(l.id)}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2.5 text-base ${
                    home && active === l.id ? "bg-accent-soft text-accent" : "text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 grid grid-cols-2 gap-2 sm:hidden">
              <a href={resumePath} download data-track="resume_download" className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-medium">
                <Download /> Resume
              </a>
              <Link href={href("contact")} onClick={() => setOpen(false)} data-track="hire_me_click" className="flex h-11 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white dark:text-[#0a0f1a]">
                Hire me
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
