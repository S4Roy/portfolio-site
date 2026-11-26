import { profile, siteUrl, skills, type Project } from "@/lib/data";

export const seo = {
  title: "Subhankar Roy | Senior Full Stack Developer, Node.js · React · Next.js",
  description:
    "Senior Full Stack Developer in Kolkata with 4+ years of experience in Node.js, TypeScript, React, Next.js, Angular and MongoDB. Enterprise SAP integrations, MERN/MEAN commerce platforms. Available immediately.",
  keywords: [
    "Subhankar Roy",
    "Senior Full Stack Engineer",
    "Senior Full Stack Developer",
    "Full Stack Developer Kolkata",
    "Node.js Developer",
    "MERN Stack Developer",
    "MEAN Stack Developer",
    "Next.js Developer",
    "React Developer",
    "TypeScript Developer",
    "Angular Developer",
  ],
};

export const personId = `${siteUrl}/#person`;

export function personJsonLd() {
  return {
    "@type": "Person",
    "@id": personId,
    name: profile.name,
    jobTitle: profile.title,
    url: siteUrl,
    image: `${siteUrl}/profile.png`,
    email: `mailto:${profile.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Kolkata", addressRegion: "West Bengal", addressCountry: "IN" },
    sameAs: [profile.linkedin, profile.github],
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Kalyani Government Engineering College" },
      { "@type": "EducationalOrganization", name: "Contai Polytechnic" },
    ],
    knowsAbout: Array.from(new Set(skills.slice(0, 4).flatMap((g) => g.items))).slice(0, 20),
  };
}

export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      personJsonLd(),
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: `${profile.name} Portfolio`,
        inLanguage: "en",
        publisher: { "@id": personId },
      },
    ],
  };
}

export function projectJsonLd(p: Project) {
  const url = `${siteUrl}/projects/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        "@id": `${url}#work`,
        name: `${p.name} case study`,
        headline: `${p.name}: ${p.category}`,
        description: p.summary,
        url,
        author: { "@id": personId },
        creator: { "@id": personId },
        keywords: p.tech.join(", "),
        ...(p.image ? { image: `${siteUrl}${p.image.src}` } : {}),
        ...(p.links[0] && !p.confidential ? { sameAs: p.links[0].href } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Projects", item: `${siteUrl}/#projects` },
          { "@type": "ListItem", position: 3, name: p.name, item: url },
        ],
      },
      personJsonLd(),
    ],
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
