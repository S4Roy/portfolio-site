import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies, getProject, resumePath } from "@/lib/data";
import { JsonLd, projectJsonLd } from "@/lib/seo";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import { ProjectVisual } from "@/components/ProjectCard";
import { Container, ExternalLink, Tag, buttonStyles } from "@/components/ui";
import { ArrowUpRight, Check } from "@/components/icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return caseStudies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  const title = `${p.name} Case Study: ${p.category}`;
  const description = `${p.summary} Built by Subhankar Roy with ${p.tech.slice(0, 4).join(", ")}.`;
  return {
    title,
    description,
    alternates: { canonical: `/projects/${p.slug}` },
    openGraph: {
      type: "article",
      url: `/projects/${p.slug}`,
      title,
      description,
      ...(p.image ? { images: [{ url: p.image.src, width: 1280, height: 800, alt: p.image.alt }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-base leading-relaxed text-muted">
        {items.map((i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function CaseStudyPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p || !p.caseStudy) notFound();

  return (
    <>
      <JsonLd data={projectJsonLd(p)} />
      <Nav home={false} />
      <main id="main" className="flex-1">
        <Container className="pt-10 sm:pt-14">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <ol className="flex flex-wrap gap-1.5">
              <li><Link href="/" className="hover:text-foreground">Home</Link> /</li>
              <li><Link href="/projects" className="hover:text-foreground">Projects</Link> /</li>
              <li aria-current="page" className="text-foreground">{p.name}</li>
            </ol>
          </nav>

          <header className="mt-6 max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <Tag>{p.category}</Tag>
              <Tag>{p.engagement}</Tag>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{p.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">{p.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {p.links.map((l, i) => (
                <ExternalLink key={l.href} href={l.href} track="project_visit" className={i === 0 ? buttonStyles.primary : buttonStyles.secondary}>
                  {l.label} <ArrowUpRight />
                </ExternalLink>
              ))}
              <a href={resumePath} download data-track="resume_download" className={buttonStyles.ghost}>Download resume</a>
            </div>
          </header>

          <div className="mt-10 overflow-hidden rounded-xl border border-border shadow-card-lg">
            <ProjectVisual project={p} sizes="(min-width: 1152px) 1088px, 100vw" priority />
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
            <div className="space-y-10">
              <section>
                <h2 className="text-xl font-semibold tracking-tight">Business problem</h2>
                <p className="mt-4 text-base leading-relaxed text-muted">{p.problem}</p>
              </section>
              <Block title="Technical implementation" items={p.implementation} />
              <Block title="Architecture and engineering decisions" items={p.decisions} />
              {p.confidential && (
                <p className="rounded-lg border border-border bg-surface-muted p-4 text-sm text-muted">
                  This is an internal enterprise application. Screenshots, data and source code are withheld; the
                  description covers my role and the engineering approach only.
                </p>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">My role</h2>
                <p className="mt-2 font-medium">{p.role}</p>
                {p.period && <p className="text-sm text-muted">{p.period}</p>}
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  {p.responsibilities.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
              {p.outcomes.length > 0 && (
                <div className="rounded-xl border border-accent/30 bg-accent-soft p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">Outcomes</h2>
                  <ul className="mt-3 space-y-2 text-sm font-medium">
                    {p.outcomes.map((o) => (
                      <li key={o} className="flex gap-2"><Check className="mt-0.5 shrink-0 text-accent" />{o}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Stack</h2>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {p.tech.map((t) => <li key={t}><Tag>{t}</Tag></li>)}
                </ul>
              </div>
            </aside>
          </div>

          <nav aria-label="More case studies" className="mt-16 border-t border-border pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">More case studies</h2>
            <ul className="mt-4 flex flex-wrap gap-3">
              {caseStudies.filter((c) => c.slug !== p.slug).map((c) => (
                <li key={c.slug}>
                  <Link href={`/projects/${c.slug}`} className={buttonStyles.secondary}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
