import { metrics } from "@/lib/data";
import { Section } from "@/components/ui";

export default function Impact() {
  return (
    <Section id="impact" eyebrow="Engineering impact" title="Results from production systems" intro="Verified figures from enterprise and commerce platforms I built or significantly extended.">
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`rounded-xl border border-border bg-surface p-5 shadow-card ${
              i < 2 ? "col-span-2 sm:col-span-1 lg:col-span-2" : "col-span-1"
            }`}
          >
            <dt className="text-sm font-medium text-muted">{m.label}</dt>
            <dd className={`mt-2 font-semibold tracking-tight text-accent ${i < 2 ? "text-4xl sm:text-5xl" : "text-3xl"}`}>{m.value}</dd>
            <dd className="mt-2 text-sm leading-snug text-muted">{m.detail}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
