import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { profile, siteUrl } from "@/lib/data";
import { formatDate, getAllPosts, getPost } from "@/lib/blog";
import { JsonLd, personId } from "@/lib/seo";
import PageShell from "@/components/PageShell";
import { ExternalLink } from "@/components/ui";
import { LinkedIn } from "@/components/icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    title: { absolute: `${p.title} | Subhankar Roy` },
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    authors: [{ name: profile.name, url: siteUrl }],
    robots: p.draft ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      url: `/blog/${p.slug}`,
      title: p.title,
      description: p.description,
      publishedTime: p.date,
      modifiedTime: p.updated ?? p.date,
      authors: [siteUrl],
      tags: p.tags,
    },
    twitter: { card: "summary_large_image", title: p.title, description: p.description },
  };
}

export default async function BlogPost({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();
  const url = `${siteUrl}/blog/${p.slug}`;
  const others = getAllPosts().filter((x) => x.slug !== p.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        mainEntityOfPage: url,
        url,
        headline: p.title,
        description: p.description,
        datePublished: p.date,
        dateModified: p.updated ?? p.date,
        inLanguage: "en",
        keywords: p.tags.join(", "),
        author: { "@id": personId, "@type": "Person", name: profile.name, url: siteUrl },
        publisher: { "@id": personId },
        image: `${siteUrl}/opengraph-image`,
        isPartOf: { "@id": `${siteUrl}/blog#blog` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog` },
          { "@type": "ListItem", position: 3, name: p.title, item: url },
        ],
      },
    ],
  };

  return (
    <PageShell crumbs={[{ label: "Blog", href: "/blog" }, { label: p.title }]}>
      <JsonLd data={jsonLd} />
      <article className="mt-6">
        <header className="max-w-3xl">
          {p.draft && (
            <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
              Draft: visible only in development. Set <code>draft: false</code> to publish.
            </p>
          )}
          <ul className="flex flex-wrap gap-1.5">
            {p.tags.map((t) => <li key={t} className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">{t}</li>)}
          </ul>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{p.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">{p.description}</p>
          <div className="mt-6 flex items-center gap-3 text-sm">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image src="/profile.png" alt="" fill sizes="40px" className="object-cover" />
            </div>
            <div>
              <p className="font-medium">
                <Link href="/" rel="author" className="hover:text-accent">{profile.name}</Link>
              </p>
              <p className="text-muted">
                <time dateTime={p.date}>{formatDate(p.date)}</time>
                {p.updated && p.updated !== p.date && <> · Updated <time dateTime={p.updated}>{formatDate(p.updated)}</time></>}
                {" "}· {p.readingMinutes} min read
              </p>
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_240px]">
          <div className="prose-blog min-w-0 max-w-3xl" dangerouslySetInnerHTML={{ __html: p.html }} />

          {p.headings.length > 2 && (
            <aside className="order-first lg:order-none">
              <nav aria-label="Table of contents" className="rounded-xl border border-border bg-surface p-5 text-sm shadow-card lg:sticky lg:top-24">
                <p className="font-semibold">On this page</p>
                <ol className="mt-3 space-y-2">
                  {p.headings.map((h) => (
                    <li key={h.id} className={h.level === 3 ? "pl-3" : ""}>
                      <a href={`#${h.id}`} className="text-muted hover:text-accent">{h.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          )}
        </div>

        <footer className="mt-14 max-w-3xl rounded-xl border border-border bg-surface p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">About the author</p>
          <p className="mt-2 font-semibold">{profile.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {profile.title} in Kolkata with 4+ years building Node.js, Angular, React and Next.js systems for enterprise and
            e-commerce. {profile.availability}.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
            <Link href="/" className="text-accent hover:text-accent-strong">Portfolio</Link>
            <Link href="/projects" className="text-accent hover:text-accent-strong">Case studies</Link>
            <ExternalLink href={profile.linkedin} track="linkedin_click" className="inline-flex items-center gap-1 text-accent hover:text-accent-strong">
              <LinkedIn /> LinkedIn
            </ExternalLink>
          </div>
        </footer>
      </article>

      {others.length > 0 && (
        <nav aria-label="More articles" className="mt-14 border-t border-border pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">More articles</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/blog/${o.slug}`} className="block rounded-xl border border-border bg-surface p-4 text-sm font-medium shadow-card hover:border-accent hover:text-accent">
                  {o.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </PageShell>
  );
}
