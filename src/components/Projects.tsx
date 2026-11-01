import { projects } from "@/lib/data";
import Reveal from "@/components/Reveal";

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-5xl px-6 py-16">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured Projects</h2>
        <p className="mt-2 text-muted">Production commerce platforms built through freelance, part-time engagements.</p>
      </Reveal>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal key={project.name} delay={i * 70}>
            <article className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-accent hover:shadow-xl hover:shadow-accent/10">
              <div className="flex flex-col items-start gap-3">
                <h3 className="text-base font-semibold transition-colors group-hover:text-accent">
                  {project.name}
                </h3>
                <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                  {project.tag}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{project.role}</p>
              {project.period && <p className="mt-1 text-xs text-muted">{project.period}</p>}
              <p className="mt-4 text-sm leading-relaxed text-muted">{project.impact}</p>
              {project.links && (
                <div className="mt-4 flex flex-wrap gap-4">
                  {project.links.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-strong">
                      {link.label}<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {project.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
