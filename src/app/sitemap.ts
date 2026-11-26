import type { MetadataRoute } from "next";
import { caseStudies, contentUpdated, siteUrl } from "@/lib/data";
import { expertise } from "@/lib/expertise";
import { getAllPosts, hasPublishedPosts } from "@/lib/blog";

// Stable <lastmod> (from contentUpdated) so Google trusts it, plus image entries
// so the portrait and project screenshots are discoverable in Google Images.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(contentUpdated);
  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      images: [`${siteUrl}/profile.png`, `${siteUrl}/opengraph-image`],
    },
    { url: `${siteUrl}/projects`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/resume`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    ...(hasPublishedPosts() ? [{ url: `${siteUrl}/blog`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 }] : []),
    ...getAllPosts()
      .filter((p) => !p.draft)
      .map((p) => ({
        url: `${siteUrl}/blog/${p.slug}`,
        lastModified: new Date(`${p.updated ?? p.date}T00:00:00+05:30`),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ...expertise.map((e) => ({
      url: `${siteUrl}/expertise/${e.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...caseStudies.map((p) => ({
      url: `${siteUrl}/projects/${p.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.8,
      ...(p.image ? { images: [`${siteUrl}${p.image.src}`] } : {}),
    })),
    {
      url: `${siteUrl}/Subhankar_Roy_Full_Stack_Developer_Resume.pdf`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
