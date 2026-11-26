import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/data";
import { ExternalLink, Tag } from "@/components/ui";
import { ArrowRight, ArrowUpRight, Lock } from "@/components/icons";

export function ProjectVisual({ project, sizes, priority = false }: { project: Project; sizes: string; priority?: boolean }) {
  if (project.image) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-surface-muted">
        <Image src={project.image.src} alt={project.image.alt} fill sizes={sizes} priority={priority} className="object-cover object-top" />
      </div>
    );
  }
  // Restricted enterprise apps: no screenshots of internal data, show a neutral tile.
  return (
    <div className="relative flex aspect-[16/10] flex-col justify-between overflow-hidden border-b border-border bg-surface-muted p-5">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <span className="relative text-2xl font-semibold tracking-tight text-accent">{project.name}</span>
      {project.confidential && (
        <span className="relative inline-flex w-fit items-center gap-1.5 rounded-md bg-surface px-2 py-1 text-xs font-medium text-muted">
          <Lock width={12} height={12} /> Internal enterprise app · screenshots withheld
        </span>
      )}
    </div>
  );
}

export default function ProjectCard({ project, large = false }: { project: Project; large?: boolean }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card transition-shadow hover:shadow-card-lg">
      <ProjectVisual project={project} sizes={large ? "(min-width: 1024px) 560px, 100vw" : "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"} />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Tag>{project.category}</Tag>
          <Tag>{project.engagement}</Tag>
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight">{project.name}</h3>
        <p className="mt-1 text-sm text-muted">{project.role}{project.period ? ` · ${project.period}` : ""}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">{project.summary}</p>

        {large && project.decisions.length > 0 && (
          <ul className="mt-4 space-y-1.5 text-sm">
            {project.decisions.slice(0, 2).map((d) => (
              <li key={d} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}

        {project.outcomes.length > 0 && (
          <ul aria-label="Outcomes" className="mt-4 flex flex-wrap gap-2">
            {project.outcomes.map((o) => (
              <li key={o} className="rounded-md bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">{o}</li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-muted">{project.tech.slice(0, large ? 8 : 5).join(" · ")}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5 text-sm font-medium">
          {project.caseStudy && (
            <Link href={`/projects/${project.slug}`} className="inline-flex items-center gap-1 text-accent hover:text-accent-strong">
              Case study <ArrowRight /> <span className="sr-only">for {project.name}</span>
            </Link>
          )}
          {project.links.map((l) => (
            <ExternalLink key={l.href} href={l.href} track="project_visit" className="inline-flex items-center gap-1 text-muted hover:text-foreground">
              {l.label} <ArrowUpRight width={14} height={14} />
            </ExternalLink>
          ))}
        </div>
      </div>
    </article>
  );
}
