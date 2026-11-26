import type { Metadata } from "next";
import { education, experienceGroups, metrics, profile, resumePath, siteUrl, skills } from "@/lib/data";
import { JsonLd, personId } from "@/lib/seo";
import PageShell from "@/components/PageShell";
import { buttonStyles } from "@/components/ui";
import { Download } from "@/components/icons";

const title = "Subhankar Roy Resume | Senior Full Stack Developer (Node.js, React, Angular)";
const description =
  "Resume of Subhankar Roy, Senior Full Stack Developer in Kolkata: 4+ years with Node.js, TypeScript, React, Next.js, Angular and MongoDB. Download the PDF.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/resume" },
  openGraph: { type: "profile", url: "/resume", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function ResumePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${siteUrl}/resume#page`,
    url: `${siteUrl}/resume`,
    name: title,
    description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": personId },
    associatedMedia: { "@type": "MediaObject", contentUrl: `${siteUrl}${resumePath}`, encodingFormat: "application/pdf", name: "Subhankar Roy Resume (PDF)" },
  };

  return (
    <PageShell crumbs={[{ label: "Resume" }]}>
      <JsonLd data={jsonLd} />
      <header className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Subhankar Roy: Resume</h1>
          <p className="mt-3 text-lg text-muted">{profile.title} · {profile.location} · {profile.availability}</p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            <a href={`mailto:${profile.email}`} data-track="contact_email" className="text-accent hover:text-accent-strong">{profile.email}</a>
            <span aria-hidden="true">·</span>
            <a href={profile.tel} data-track="contact_phone" className="text-accent hover:text-accent-strong">{profile.phoneDisplay}</a>
            <span aria-hidden="true">·</span>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" data-track="linkedin_click" className="text-accent hover:text-accent-strong">
              LinkedIn<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
        </div>
        <a href={resumePath} download data-track="resume_download" className={buttonStyles.primary}>
          <Download /> Download PDF
        </a>
      </header>

      <section aria-labelledby="sum" className="mt-10">
        <h2 id="sum" className="text-xl font-semibold">Summary</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted">{profile.intro}</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col-reverse rounded-xl border border-border bg-surface p-4 shadow-card">
              <dt className="mt-1 text-xs text-muted">{m.label}</dt>
              <dd className="text-2xl font-semibold text-accent">{m.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="exp" className="mt-12">
        <h2 id="exp" className="text-xl font-semibold">Experience</h2>
        {experienceGroups.map((g) => (
          <div key={g.title} className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">{g.title}</h3>
            <ul className="mt-3 space-y-4">
              {g.entries.map((e) => (
                <li key={e.company + e.period} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <h4 className="font-semibold">{e.role} <span className="font-normal text-muted">· {e.company}</span></h4>
                    <p className="text-sm text-muted">{e.period}</p>
                  </div>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                    {[...e.highlights, ...e.details].map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="sk" className="mt-12">
        <h2 id="sk" className="text-xl font-semibold">Skills</h2>
        <dl className="mt-4 space-y-2 text-sm">
          {skills.map((s) => (
            <div key={s.category} className="grid gap-1 sm:grid-cols-[200px_1fr]">
              <dt className="font-semibold">{s.category}</dt>
              <dd className="text-muted">{s.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="ed" className="mt-12">
        <h2 id="ed" className="text-xl font-semibold">Education</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {education.map((e) => (
            <li key={e.degree}><span className="font-semibold">{e.degree}</span> · {e.school} · {e.period} · {e.detail}</li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
