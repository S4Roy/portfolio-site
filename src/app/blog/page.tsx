import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/data";
import { formatDate, getAllPosts, hasPublishedPosts } from "@/lib/blog";
import { JsonLd, personId } from "@/lib/seo";
import PageShell from "@/components/PageShell";
import { ArrowRight } from "@/components/icons";

const title = "Blog | Subhankar Roy, Full Stack Developer";
const description =
  "Practical articles by Subhankar Roy on Node.js, Angular, React, Next.js, MongoDB and deployment, drawn from building enterprise and e-commerce systems.";

export const metadata: Metadata = {
  title: { absolute: title },
  // Keep the blog index out of search results until a post is published.
  ...(hasPublishedPosts() ? {} : { robots: { index: false, follow: true } }),
  description,
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
  openGraph: { url: "/blog", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function BlogIndex() {
  const posts = getAllPosts();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteUrl}/blog#blog`,
    url: `${siteUrl}/blog`,
    name: title,
    description,
    author: { "@id": personId },
    publisher: { "@id": personId },
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${siteUrl}/blog/${p.slug}`, datePublished: p.date })),
  };

  return (
    <PageShell crumbs={[{ label: "Blog" }]}>
      <JsonLd data={jsonLd} />
      <header className="mt-6 max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Blog</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{description}</p>
      </header>

      {posts.length === 0 ? (
        <p className="mt-10 rounded-xl border border-border bg-surface p-6 text-muted">Articles are on the way.</p>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-2">
          {posts.map((p) => (
            <li key={p.slug}>
              <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-card transition-shadow hover:shadow-card-lg">
                <p className="text-xs text-muted">
                  <time dateTime={p.date}>{formatDate(p.date)}</time> · {p.readingMinutes} min read
                  {p.draft && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">DRAFT</span>}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  <Link href={`/blog/${p.slug}`} className="hover:text-accent">{p.title}</Link>
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => <li key={t} className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">{t}</li>)}
                </ul>
                <Link href={`/blog/${p.slug}`} className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-accent hover:text-accent-strong">
                  Read article <ArrowRight /> <span className="sr-only">: {p.title}</span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
