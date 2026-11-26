import { contentUpdated, profile, siteUrl, skills, type Project } from "@/lib/data";

export const seo = {
  title: "Subhankar Roy | Senior Full Stack Developer in Kolkata, India",
  description:
    "Subhankar Roy is a Senior Full Stack Developer in Kolkata, India with 4+ years in Node.js, Angular, React, Next.js, TypeScript and MongoDB. Available for hire.",
};

export const personId = `${siteUrl}/#person`;

export function personJsonLd() {
  return {
    "@type": "Person",
    "@id": personId,
    name: profile.name,
    givenName: "Subhankar",
    familyName: "Roy",
    alternateName: ["S4Roy"],
    description: seo.description,
    jobTitle: profile.title,
    hasOccupation: {
      "@type": "Occupation",
      name: "Full Stack Developer",
      occupationLocation: { "@type": "City", name: "Kolkata" },
      skills: profile.primaryStack.join(", "),
    },
    url: siteUrl,
    mainEntityOfPage: `${siteUrl}/#profilepage`,
    image: { "@type": "ImageObject", "@id": `${siteUrl}/#portrait`, url: `${siteUrl}/profile.png`, width: 360, height: 360, caption: profile.name },
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
        name: profile.name,
        alternateName: [`${profile.name} Portfolio`, "subhankarroy.in"],
        description: seo.description,
        inLanguage: "en",
        publisher: { "@id": personId },
      },
    ],
  };
}

// Home page only: marks the page as the canonical profile of the Person.
export function profilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${siteUrl}/#profilepage`,
    url: siteUrl,
    name: seo.title,
    description: seo.description,
    inLanguage: "en",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": personId },
    mainEntity: { "@id": personId },
    primaryImageOfPage: { "@id": `${siteUrl}/#portrait` },
    dateModified: contentUpdated,
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
          { "@type": "ListItem", position: 2, name: "Projects", item: `${siteUrl}/projects` },
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
