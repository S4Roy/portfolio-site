import { skills, education } from "@/lib/data";
import Reveal from "@/components/Reveal";

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-5xl px-6 py-16">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Skills</h2>
      </Reveal>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {skills.map((group, i) => (
          <Reveal key={group.category} delay={i * 50}>
            <div>
              <h3 className="text-sm font-semibold text-muted">{group.category}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border px-3 py-1 text-sm transition-colors duration-200 hover:border-accent hover:text-accent"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <h2 className="mt-16 text-2xl font-bold tracking-tight sm:text-3xl">Education</h2>
      </Reveal>
      <div className="mt-8 space-y-6">
        {education.map((item, i) => (
          <Reveal key={item.degree} delay={i * 60}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div>
                <p className="font-semibold">{item.degree}</p>
                <p className="text-sm text-muted">{item.school}</p>
              </div>
              <p className="text-sm text-muted">
                {item.period} &middot; {item.detail}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
