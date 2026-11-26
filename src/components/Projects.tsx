import { projects } from "@/lib/data";
import { Section } from "@/components/ui";
import ProjectCard from "@/components/ProjectCard";

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
    </Section>
  );
}
