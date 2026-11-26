import type { Metadata } from "next";
import Link from "next/link";
import { projects, siteUrl } from "@/lib/data";
import { expertise } from "@/lib/expertise";
import { JsonLd, personId } from "@/lib/seo";
import PageShell from "@/components/PageShell";
import ProjectCard from "@/components/ProjectCard";

const title = "Projects & Case Studies | Subhankar Roy, Full Stack Developer";
const description =
  "Projects by Subhankar Roy, full stack developer in Kolkata: enterprise travel, procurement and SSO platforms plus production e-commerce in Node.js, React and Angular.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/projects" },
  openGraph: { url: "/projects", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function ProjectsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/projects#page`,
    url: `${siteUrl}/projects`,
    name: title,
    description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": personId },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        ...(p.caseStudy ? { url: `${siteUrl}/projects/${p.slug}` } : {}),
      })),
    },
  };

  return (
    <PageShell crumbs={[{ label: "Projects" }]}>
      <JsonLd data={jsonLd} />
      <header className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Projects and case studies</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Enterprise platforms delivered in full-time roles and production commerce built as contract client projects.
          Internal systems are described without confidential data.
        </p>
      </header>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => <ProjectCard key={p.slug} project={p} />)}
      </div>
      <nav aria-label="Expertise" className="mt-14 border-t border-border pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Browse by technology</h2>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {expertise.map((e) => (
            <li key={e.slug}>
              <Link href={`/expertise/${e.slug}`} className="rounded-md border border-border bg-surface px-3 py-1.5 hover:border-accent hover:text-accent">
                {e.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </PageShell>
  );
}
