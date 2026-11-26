import Image from "next/image";
import { metrics, profile, resumePath } from "@/lib/data";
import { Container, ExternalLink, buttonStyles } from "@/components/ui";
import { ArrowRight, Download, LinkedIn, MapPin } from "@/components/icons";

const glance = [
  { k: "Role", v: "Senior Full Stack Developer" },
  { k: "Focus", v: "Node.js · TypeScript · React · Next.js" },
  { k: "Also", v: "Angular · MongoDB · AWS" },
  { k: "Based", v: "Kolkata · Remote / hybrid" },
];

// Verified headline figures shown in the card (subset of `metrics`).
const cardMetrics = ["Employees served", "Faster document loading", "Monthly orders", "Monthly sales"]
  .map((label) => metrics.find((m) => m.label === label))
  .filter((m): m is (typeof metrics)[number] => Boolean(m));

export default function Hero() {
  return (
    <section id="home" aria-labelledby="hero-title" className="border-b border-border pb-16 pt-12 sm:pb-24 sm:pt-20">
      <Container className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-accent/30 ring-offset-2 ring-offset-background sm:h-20 sm:w-20">
              <Image
                src="/profile.png"
                alt="Portrait of Subhankar Roy, Senior Full Stack Developer"
                fill
                sizes="80px"
                priority
                className="object-cover"
              />
            </div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium shadow-card">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {profile.availability}
            </p>
          </div>

          <h1 id="hero-title" className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {profile.name}
            <span className="mt-2 block text-accent">{profile.title}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{profile.intro}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#projects" className={buttonStyles.primary}>
              View projects <ArrowRight />
            </a>
            <a href={resumePath} download data-track="resume_download" className={buttonStyles.secondary}>
              <Download /> Download resume
            </a>
            <ExternalLink href={profile.linkedin} track="linkedin_click" className={buttonStyles.secondary}>
              <LinkedIn /> LinkedIn
            </ExternalLink>
          </div>

          <p className="mt-6 flex items-center gap-1.5 text-sm text-muted">
            <MapPin /> {profile.location}
          </p>
        </div>

        <aside aria-label="Profile at a glance" className="rounded-2xl border border-border bg-surface shadow-card-lg">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">At a glance</p>
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" /> Open to work
            </p>
          </div>

          <dl className="divide-y divide-border px-6">
            {glance.map((row) => (
              <div key={row.k} className="grid grid-cols-[72px_1fr] gap-3 py-3 text-sm">
                <dt className="text-muted">{row.k}</dt>
                <dd className="font-medium">{row.v}</dd>
              </div>
            ))}
          </dl>

          <dl className="grid grid-cols-2 border-t border-border">
            {cardMetrics.map((m, i) => (
              <div
                key={m.label}
                className={`flex flex-col-reverse px-6 py-5 ${i % 2 === 0 ? "border-r border-border" : ""} ${i < 2 ? "border-b border-border" : ""}`}
              >
                <dt className="mt-1 text-xs text-muted">{m.label}</dt>
                <dd className="text-2xl font-semibold tracking-tight text-accent sm:text-3xl">{m.value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-border px-6 py-4">
            <p className="text-xs text-muted">Primary stack</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {profile.primaryStack.map((t) => (
                <li key={t} className="rounded-md border border-border bg-surface-muted px-2 py-0.5 text-xs font-medium">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </Container>
    </section>
  );
}
