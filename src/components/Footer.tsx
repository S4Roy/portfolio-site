import { profile } from "@/lib/data";

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Let&apos;s connect</h2>
        <p className="mt-2 max-w-xl text-muted">
          {profile.availability}. {profile.workPreferences} Reach out via email or LinkedIn.
        </p>

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <a href={`mailto:${profile.email}`} className="hover:text-accent-strong">
            {profile.email}
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent-strong"
          >
            linkedin.com/in/s4roy
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent-strong"
          >
            github.com/S4Roy
          </a>
          <a
            href={profile.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent-strong"
          >
            WhatsApp: {profile.phone}
          </a>
        </div>

        <p className="mt-10 text-xs text-muted">
          &copy; {new Date().getFullYear()} {profile.name}. Built with Next.js &amp; Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
