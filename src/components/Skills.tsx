import { skills } from "@/lib/data";
import Link from "next/link";
import { Section } from "@/components/ui";
import { expertise } from "@/lib/expertise";

export default function Skills() {
  return (
    <Section id="skills" eyebrow="Technical expertise" title="Skills used in production" intro="Grouped by where they show up in my work. No self-rated bars, just the tools I have shipped with.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((g) => (
          <div key={g.category} className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <h3 className="font-semibold">{g.category}</h3>
            <p className="text-sm text-muted">{g.description}</p>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {g.items.map((item) => (
                <li key={item} className="rounded-md border border-border bg-surface-muted px-2 py-1 text-sm">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <nav aria-label="Expertise" className="mt-8">
        <h3 className="text-sm font-semibold text-muted">Expertise in depth</h3>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {expertise.map((e) => (
            <li key={e.slug}>
              <Link href={`/expertise/${e.slug}`} className="rounded-md border border-border bg-surface px-3 py-1.5 font-medium hover:border-accent hover:text-accent">
                {e.name} developer
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Section>
  );
}
