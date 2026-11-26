import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`py-16 sm:py-24 ${className}`}>
      <Container>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
        {intro && <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">{intro}</p>}
        <div className="mt-10">{children}</div>
      </Container>
    </section>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-surface-muted px-2 py-0.5 text-xs font-medium text-muted">
      {children}
    </span>
  );
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-150";

export const buttonStyles = {
  primary: `${base} bg-accent text-white hover:bg-accent-strong dark:text-[#0a0f1a]`,
  secondary: `${base} border border-border bg-surface text-foreground hover:border-accent hover:text-accent`,
  ghost: `${base} text-muted hover:text-foreground`,
};

export function ExternalLink({
  href,
  children,
  className,
  track,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  track?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} data-track={track}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
