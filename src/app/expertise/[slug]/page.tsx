import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { experienceGroups, profile, projects, resumePath, siteUrl } from "@/lib/data";
import { expertise, getExpertise } from "@/lib/expertise";
import { JsonLd, personId } from "@/lib/seo";
import PageShell from "@/components/PageShell";
import ProjectCard from "@/components/ProjectCard";
import { buttonStyles } from "@/components/ui";
import { ArrowRight, Check, Download } from "@/components/icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return expertise.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/expertise/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const e = getExpertise(slug);
  if (!e) return {};
  return {
    title: { absolute: e.metaTitle },
    description: e.description,
    alternates: { canonical: `/expertise/${e.slug}` },
    openGraph: { type: "profile", url: `/expertise/${e.slug}`, title: e.metaTitle, description: e.description },
    twitter: { card: "summary_large_image", title: e.metaTitle, description: e.description },
  };
}

export default async function ExpertisePage({ params }: PageProps<"/expertise/[slug]">) {
  const { slug } = await params;
  const e = getExpertise(slug);
  if (!e) notFound();

  const matched = projects.filter((p) => e.matchTech.some((t) => p.tech.includes(t)));
  const related = e.related.map(getExpertise).filter((x) => x !== undefined);
  const roles = experienceGroups.flatMap((g) => g.entries).slice(0, 4);
  const url = `${siteUrl}/expertise/${e.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: e.metaTitle,
        description: e.description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": personId },
        mentions: matched.filter((p) => p.caseStudy).map((p) => ({ "@id": `${siteUrl}/projects/${p.slug}#work` })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Expertise", item: `${siteUrl}/#skills` },
          { "@type": "ListItem", position: 3, name: e.name, item: url },
        ],
      },
    ],
  };

  return (
    <PageShell crumbs={[{ label: "Expertise", href: "/#skills" }, { label: e.name }]}>
      <JsonLd data={jsonLd} />
      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{profile.name} · {profile.availability}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{e.title}</h1>
        <div className="mt-5 space-y-4 text-lg leading-relaxed text-muted">
          {e.intro.map((p) => <p key={p}>{p}</p>)}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/#contact" data-track="hire_me_click" className={buttonStyles.primary}>
            Hire me <ArrowRight />
          </Link>
          <a href={resumePath} download data-track="resume_download" className={buttonStyles.secondary}>
            <Download /> Download resume
          </a>
        </div>
      </header>

      <section aria-labelledby="cap-title" className="mt-14">
        <h2 id="cap-title" className="text-2xl font-semibold tracking-tight">What I build with {e.name}</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {e.capabilities.map((c) => (
            <li key={c} className="flex gap-3 rounded-xl border border-border bg-surface p-4 text-sm shadow-card">
              <Check className="mt-0.5 shrink-0 text-accent" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </section>

      {matched.length > 0 && (
        <section aria-labelledby="proj-title" className="mt-14">
          <h2 id="proj-title" className="text-2xl font-semibold tracking-tight">{e.name} projects</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matched.map((p) => <ProjectCard key={p.slug} project={p} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="exp-title" className="mt-14">
        <h2 id="exp-title" className="text-2xl font-semibold tracking-tight">Experience</h2>
        <ul className="mt-5 divide-y divide-border rounded-xl border border-border bg-surface shadow-card">
          {roles.map((r) => (
            <li key={r.company + r.period} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-5 py-4 text-sm">
              <span><span className="font-medium">{r.role}</span> <span className="text-muted">· {r.company}</span></span>
              <span className="text-muted">{r.period}</span>
            </li>
          ))}
        </ul>
        <Link href="/#experience" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-strong">
          Full experience <ArrowRight />
        </Link>
      </section>

      {related.length > 0 && (
        <nav aria-label="Related expertise" className="mt-14 border-t border-border pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Related expertise</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/expertise/${r.slug}`} className={buttonStyles.secondary}>{r.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </PageShell>
  );
}
