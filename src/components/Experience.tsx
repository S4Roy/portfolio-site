import { experienceGroups } from "@/lib/data";
import { ExternalLink, Section } from "@/components/ui";
import { Chevron } from "@/components/icons";

export default function Experience() {
  return (
    <Section id="experience" eyebrow="Professional experience" title="Where I've worked" intro="Full-time roles, earlier contracts and client projects.">
      <div className="space-y-12">
        {experienceGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">{group.title}</h3>
            <ol className="mt-5 space-y-4 border-l border-border pl-5 sm:pl-7">
              {group.entries.map((e) => (
                <li key={e.company + e.period} className="relative">
                  <span aria-hidden="true" className="absolute -left-[25px] top-6 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent sm:-left-[33px]" />
                  <article className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h4 className="text-lg font-semibold">{e.role}</h4>
                      <p className="text-sm font-medium text-muted">
                        <time>{e.period}</time>
                      </p>
                    </div>
                    <p className="text-sm text-muted">{e.company}{e.location ? ` · ${e.location}` : ""}</p>
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed">
                      {e.highlights.map((h) => (
                        <li key={h} className="flex gap-2.5">
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <details className="mt-4 border-t border-border pt-3">
                      <summary className="inline-flex items-center gap-1 rounded text-sm font-medium text-accent">
                        More details <Chevron className="chevron transition-transform" />
                      </summary>
                      {e.note && <p className="mt-3 text-sm text-muted">{e.note}</p>}
                      <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted">
                        {e.details.map((d) => (
                          <li key={d} className="flex gap-2.5">
                            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                      {e.links && (
                        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                          {e.links.map((l) => (
                            <li key={l.href}>
                              <ExternalLink href={l.href} track="project_visit" className="text-accent underline underline-offset-4 hover:text-accent-strong">
                                {l.label}
                              </ExternalLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </article>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </Section>
  );
}
