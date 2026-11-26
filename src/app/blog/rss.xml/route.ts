import { getAllPosts } from "@/lib/blog";
import { profile, siteUrl } from "@/lib/data";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function GET() {
  const posts = getAllPosts().filter((p) => !p.draft);
  const items = posts
    .map(
      (p) => `<item>
  <title>${esc(p.title)}</title>
  <link>${siteUrl}/blog/${p.slug}</link>
  <guid isPermaLink="true">${siteUrl}/blog/${p.slug}</guid>
  <description>${esc(p.description)}</description>
  <pubDate>${new Date(`${p.date}T00:00:00+05:30`).toUTCString()}</pubDate>
  ${p.tags.map((t) => `<category>${esc(t)}</category>`).join("")}
</item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(profile.name)} Blog</title>
  <link>${siteUrl}/blog</link>
  <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
  <description>Articles on Node.js, Angular, React, Next.js and MongoDB by ${esc(profile.name)}.</description>
  <language>en</language>
${items}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
