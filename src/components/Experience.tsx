import { experience } from "@/lib/data";
import Reveal from "@/components/Reveal";

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-5xl px-6 py-16">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Experience</h2>
        <p className="mt-2 text-muted">A timeline of roles across web development.</p>
      </Reveal>

      <ol className="mt-10 space-y-10 border-l border-border pl-8">
        {experience.map((entry, i) => (
          <Reveal key={`${entry.company}-${entry.period}`} delay={i * 60}>
            <li className="relative list-none">
              <span className="absolute -left-[calc(2rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-lg font-semibold">
                  {entry.role} <span className="text-muted">— {entry.company}</span>
                </h3>
                <span className="text-sm font-medium text-muted">{entry.period}</span>
              </div>
              {entry.type && (
                <span className="mt-1 inline-block rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-muted">
                  {entry.type}
                </span>
              )}
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-muted">
                {entry.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
