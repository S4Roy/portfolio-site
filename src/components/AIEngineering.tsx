import { aiPractices, aiPrinciples } from "@/lib/data";
import { Section } from "@/components/ui";
import { Check } from "@/components/icons";

export default function AIEngineering() {
  return (
    <Section
      id="ai"
      eyebrow="AI-assisted engineering"
      title="Faster delivery, same engineering bar"
      intro="I use Claude Code and OpenAI Codex day to day on my current projects. They speed up the work, but I still own the design, the review and the result."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <ul className="grid gap-4 sm:grid-cols-2">
          {aiPractices.map((p) => (
            <li key={p.title} className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ul>
        <aside className="rounded-xl border border-accent/30 bg-accent-soft p-6">
          <h3 className="font-semibold">Guardrails I work by</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {aiPrinciples.map((p) => (
              <li key={p} className="flex gap-2.5">
                <Check className="mt-0.5 shrink-0 text-accent" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Section>
  );
}
