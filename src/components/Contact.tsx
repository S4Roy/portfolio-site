import { profile, resumePath } from "@/lib/data";
import { Container, ExternalLink, buttonStyles } from "@/components/ui";
import { Download, GitHub, LinkedIn, Mail, Phone, WhatsApp } from "@/components/icons";

export default function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="py-16 sm:py-24">
      <Container>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card-lg sm:p-10 lg:p-12">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-success">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" /> {profile.availability}
          </p>
          <h2 id="contact-title" className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Hiring a senior full stack engineer?
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
            I&apos;m looking for senior Node.js, MERN, MEAN and full-stack roles. {profile.workPreferences}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${profile.email}?subject=Senior%20Full%20Stack%20role`} data-track="contact_email" className={buttonStyles.primary}>
              <Mail /> {profile.email}
            </a>
            <a href={profile.tel} data-track="contact_phone" className={buttonStyles.secondary}>
              <Phone /> {profile.phoneDisplay}
            </a>
            <ExternalLink href={profile.whatsapp} track="contact_whatsapp" className={buttonStyles.secondary}>
              <WhatsApp /> WhatsApp
            </ExternalLink>
            <ExternalLink href={profile.linkedin} track="linkedin_click" className={buttonStyles.secondary}>
              <LinkedIn /> LinkedIn
            </ExternalLink>
            <ExternalLink href={profile.github} track="github_click" className={buttonStyles.secondary}>
              <GitHub /> GitHub
            </ExternalLink>
            <a href={resumePath} download data-track="resume_download" className={buttonStyles.secondary}>
              <Download /> Resume (PDF)
            </a>
          </div>

          <div className="mt-10 border-t border-border pt-6 text-sm text-muted">
            <p>
              <span className="font-semibold text-foreground">Need software built?</span> I also take on select
              consulting and development work: commerce platforms, internal tools and API integrations.{" "}
              <a href={`mailto:${profile.email}?subject=Project%20inquiry`} data-track="contact_consulting" className="font-medium text-accent underline underline-offset-4 hover:text-accent-strong">
                Send a project inquiry
              </a>{" "}
              or{" "}
              <ExternalLink href={profile.whatsapp} track="contact_whatsapp" className="font-medium text-accent underline underline-offset-4 hover:text-accent-strong">
                message on WhatsApp
              </ExternalLink>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
