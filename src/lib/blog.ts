import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked } from "marked";

/**
 * Blog posts live in content/blog/<slug>.md with a small front-matter block:
 *
 * ---
 * title: Post title (also the H1)
 * description: Meta description, ~150 characters
 * date: 2026-11-27
 * updated: 2026-11-27        (optional)
 * tags: Node.js, Payments     (comma separated)
 * keyword: primary search keyword (optional, informational)
 * draft: true                 (drafts are hidden in production builds)
 * ---
 */

export type Heading = { id: string; text: string; level: 2 | 3 };

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  keyword?: string;
  draft: boolean;
  html: string;
  headings: Heading[];
  readingMinutes: number;
};

const dir = join(process.cwd(), "content/blog");

const slugify = (s: string) =>
  s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function parse(slug: string, raw: string): Post {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Missing front matter in ${slug}.md`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  for (const k of ["title", "description", "date"]) if (!meta[k]) throw new Error(`${slug}.md: missing "${k}"`);

  const headings: Heading[] = [];
  const md = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        if (depth === 2 || depth === 3) {
          const id = slugify(text);
          headings.push({ id, text: text.replace(/<[^>]+>/g, ""), level: depth });
          return `<h${depth} id="${id}"><a href="#${id}">${text}</a></h${depth}>\n`;
        }
        return `<h${depth}>${text}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !href.includes("subhankarroy.in");
        const t = title ? ` title="${title}"` : "";
        return external
          ? `<a href="${href}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`
          : `<a href="${href}"${t}>${text}</a>`;
      },
    },
  });
  const html = md.parse(m[2], { async: false }) as string;
  const words = m[2].replace(/```[\s\S]*?```/g, " ").split(/\s+/).length;

  return {
    slug,
    title: meta.title,
    description: meta.description,
    date: meta.date,
    updated: meta.updated || undefined,
    tags: (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    keyword: meta.keyword || undefined,
    draft: meta.draft === "true",
    html,
    headings,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
}

const showDrafts = process.env.NODE_ENV !== "production" || process.env.SHOW_DRAFTS === "true";

export function getAllPosts(): Post[] {
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return files
    .map((f) => parse(f.replace(/\.md$/, ""), readFileSync(join(dir, f), "utf8")))
    .filter((p) => showDrafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const getPost = (slug: string) => getAllPosts().find((p) => p.slug === slug);

export const formatDate = (d: string) =>
  new Date(`${d}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** True when at least one non-draft post exists (drives blog links, sitemap and indexing). */
export const hasPublishedPosts = () => getAllPosts().some((p) => !p.draft);
