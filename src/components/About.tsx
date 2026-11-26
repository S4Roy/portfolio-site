import { education, profile } from "@/lib/data";
import { Section } from "@/components/ui";

export default function About() {
  return (
    <Section id="about" eyebrow="About" title="About Subhankar Roy">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 text-base leading-relaxed text-muted">
          <p>
            I&apos;m Subhankar Roy, a senior full stack developer based in Kolkata with 4+ years of full-time experience, plus earlier
            contracts going back to 2020. Most of my work sits where business processes meet software: procurement, travel
            and expenses, document management, e-signature and commerce.
          </p>
          <p>
            My core is Node.js and TypeScript on the backend, with React, Next.js and Angular on the front. I care about
            correctness under load (transactions, idempotency, access control), integrations that hold up in production
            (SAP, payment gateways, logistics), and tests that catch problems before users do.
          </p>
          <p>{profile.workPreferences}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Education</h3>
          <ul className="mt-4 space-y-3">
            {education.map((e) => (
              <li key={e.degree} className="rounded-xl border border-border bg-surface p-4 shadow-card">
                <p className="font-semibold">{e.degree}</p>
                <p className="text-sm text-muted">{e.school}</p>
                <p className="mt-1 text-sm text-muted">{e.period} · {e.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
