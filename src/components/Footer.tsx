import Link from "next/link";
import { profile } from "@/lib/data";
import { expertise } from "@/lib/expertise";
import { hasPublishedPosts } from "@/lib/blog";
import { Container, ExternalLink } from "@/components/ui";

export default function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <Container className="grid gap-8 text-sm text-muted sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-semibold text-foreground">{profile.name}</p>
          <p className="mt-1">{profile.title} · {profile.location}</p>
          <p className="mt-4">&copy; {new Date().getFullYear()} {profile.name}</p>
        </div>
        <nav aria-label="Expertise">
          <p className="font-semibold text-foreground">Expertise</p>
          <ul className="mt-2 space-y-1.5">
            {expertise.map((e) => (
              <li key={e.slug}><Link href={`/expertise/${e.slug}`} className="hover:text-foreground">{e.name} Developer</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Site">
          <p className="font-semibold text-foreground">Links</p>
          <ul className="mt-2 space-y-1.5">
            <li><Link href="/projects" className="hover:text-foreground">Projects</Link></li>
            <li><Link href="/resume" className="hover:text-foreground">Resume</Link></li>
            {hasPublishedPosts() && <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>}
            <li><a href={`mailto:${profile.email}`} className="hover:text-foreground">Email</a></li>
            <li><ExternalLink href={profile.linkedin} className="hover:text-foreground">LinkedIn</ExternalLink></li>
            <li><ExternalLink href={profile.github} className="hover:text-foreground">GitHub</ExternalLink></li>
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
