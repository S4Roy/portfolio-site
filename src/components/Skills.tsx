import { skills } from "@/lib/data";
import { Section } from "@/components/ui";

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
    </Section>
  );
}
