import Image from "next/image";
import { profile, coreStack, highlights } from "@/lib/data";

export default function Hero() {
  return (
    <section
      id="about"
      className="mx-auto max-w-5xl px-6 pb-16 pt-16 sm:pt-24"
    >
      <div className="flex flex-col-reverse items-center gap-10 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl animate-fade-in-up">
          <p className="text-sm font-medium text-accent">
            Hi, I&apos;m {profile.name.split(" ")[0]} 👋
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {profile.name}
          </h1>
          <p className="mt-3 text-lg text-muted sm:text-xl">
            {profile.title} &middot; {profile.tagline}
          </p>
          <p className="mt-4 text-sm text-muted">{profile.location}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-accent">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {profile.availability}
          </div>
          <p className="mt-6 text-base leading-relaxed text-muted">
            {profile.summary}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/Subhankar_Roy_Resume.pdf"
              download
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-strong hover:shadow-lg hover:shadow-accent/20"
            >
              Download Resume
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              Email Me
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              LinkedIn
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="shrink-0 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="relative h-40 w-40 overflow-hidden rounded-full ring-4 ring-accent-soft ring-offset-4 ring-offset-background transition-transform duration-300 hover:scale-105 sm:h-48 sm:w-48">
            <Image
              src="/profile.png"
              alt={profile.name}
              fill
              sizes="192px"
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>

      <dl className="mt-12 grid gap-4 sm:grid-cols-3">
        {highlights.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-surface p-5">
            <dt className="text-sm font-medium text-muted">{item.label}</dt>
            <dd className="mt-2 text-2xl font-bold tracking-tight text-accent">{item.value}</dd>
            <dd className="mt-1 text-xs leading-relaxed text-muted">{item.detail}</dd>
          </div>
        ))}
      </dl>

      <div
        className="mt-14 animate-fade-in-up"
        style={{ animationDelay: "220ms" }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Core Stack
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {coreStack.map((tech) => (
            <div
              key={tech.name}
              className="group rounded-xl border border-border bg-surface px-4 py-3 text-center transition-all duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-md"
            >
              <p className="text-sm font-semibold">{tech.name}</p>
              <p className="mt-0.5 text-xs text-muted group-hover:text-accent">
                {tech.group}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
