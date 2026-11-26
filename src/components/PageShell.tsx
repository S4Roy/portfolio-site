import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { Container } from "@/components/ui";

/** Shared layout for secondary pages: nav, breadcrumb, content, hiring CTA, footer. */
export default function PageShell({
  crumbs,
  children,
}: {
  crumbs: { label: string; href?: string }[];
  children: ReactNode;
}) {
  return (
    <>
      <Nav home={false} />
      <main id="main" className="flex-1">
        <Container className="pt-10 sm:pt-14">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <ol className="flex flex-wrap gap-1.5">
              <li>
                <Link href="/" className="hover:text-foreground">Home</Link> /
              </li>
              {crumbs.map((c, i) => (
                <li key={c.label} aria-current={i === crumbs.length - 1 ? "page" : undefined} className={i === crumbs.length - 1 ? "text-foreground" : ""}>
                  {c.href ? <Link href={c.href} className="hover:text-foreground">{c.label}</Link> : c.label}
                  {i < crumbs.length - 1 ? " /" : ""}
                </li>
              ))}
            </ol>
          </nav>
          {children}
        </Container>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
