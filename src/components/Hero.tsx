import Image from "next/image";
import { profile, resumePath } from "@/lib/data";
import { Container, ExternalLink, buttonStyles } from "@/components/ui";
import { ArrowRight, Download, LinkedIn, MapPin } from "@/components/icons";

export default function Hero() {
  return (
    <section id="home" aria-labelledby="hero-title" className="border-b border-border pb-16 pt-12 sm:pb-24 sm:pt-20">
      <Container className="grid items-center gap-12 md:grid-cols-[1fr_auto]">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground shadow-card">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {profile.availability}
          </p>

          <h1 id="hero-title" className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {profile.name}
            <span className="mt-2 block text-accent">{profile.title}</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted">{profile.intro}</p>

          <ul aria-label="Primary stack" className="mt-6 flex flex-wrap gap-2">
            {profile.primaryStack.map((t) => (
              <li key={t} className="rounded-md border border-border bg-surface px-2.5 py-1 text-sm font-medium">
                {t}
              </li>
            ))}
          </ul>

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
            <MapPin /> {profile.location} · Remote / hybrid
          </p>
        </div>

        <div className="order-first md:order-none">
          <div className="relative mx-auto h-36 w-36 overflow-hidden rounded-2xl border border-border bg-surface shadow-card-lg sm:h-44 sm:w-44 md:h-64 md:w-64">
            <Image
              src="/profile.png"
              alt="Portrait of Subhankar Roy, Senior Full Stack Developer"
              fill
              sizes="(min-width: 768px) 256px, (min-width: 640px) 176px, 144px"
              priority
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
