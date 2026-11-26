import { profile } from "@/lib/data";
import { Container, ExternalLink } from "@/components/ui";

export default function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <Container className="flex flex-col gap-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} {profile.name} · {profile.location}</p>
        <ul className="flex gap-5">
          <li><a href={`mailto:${profile.email}`} className="hover:text-foreground">Email</a></li>
          <li><ExternalLink href={profile.linkedin} className="hover:text-foreground">LinkedIn</ExternalLink></li>
          <li><ExternalLink href={profile.github} className="hover:text-foreground">GitHub</ExternalLink></li>
        </ul>
      </Container>
    </footer>
  );
}
