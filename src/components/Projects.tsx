import { projects } from "@/lib/data";
import { Section } from "@/components/ui";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import { ArrowRight } from "@/components/icons";

export default function Projects() {
  const [first, second, ...rest] = projects;
  return (
    <Section
      id="projects"
      eyebrow="Featured work"
      title="Projects and case studies"
      intro="Production commerce I own end to end, and enterprise platforms delivered in full-time roles. Internal systems are described without confidential data."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <ProjectCard project={first} large />
        <ProjectCard project={second} large />
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
      <Link href="/projects" className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-strong">
        All projects <ArrowRight />
      </Link>
    </Section>
  );
}
