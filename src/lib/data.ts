export const profile = {
  name: "Subhankar Roy",
  title: "Full Stack Developer",
  tagline: "5+ Years of Experience",
  location: "South 24 Parganas, West Bengal, India",
  email: "subhankarroylive@gmail.com",
  phone: "+91 8906787168",
  whatsapp: "https://wa.me/918906787168",
  linkedin: "https://www.linkedin.com/in/s4roy/",
  github: "https://github.com/S4Roy/",
  summary:
    "Full Stack Developer with 5+ years of experience across Angular, Node.js, MongoDB, and TypeScript, building scalable ERP, logistics, eCommerce, and healthcare solutions. Track record of measurable impact, including a 20% cost reduction in logistics operations and a 90% reduction in audiometry report turnaround time. Collaborative problem-solver focused on clean architecture, continuous learning, and user-centric product development.",
};

export const coreStack: { name: string; group: string }[] = [
  { name: "Angular", group: "Frontend" },
  { name: "React", group: "Frontend" },
  { name: "Next.js", group: "Frontend" },
  { name: "Node.js", group: "Backend" },
  { name: "MongoDB", group: "Database" },
  { name: "PostgreSQL", group: "Database" },
  { name: "AWS", group: "Cloud" },
  { name: "GCP", group: "Cloud" },
];

export const skills: { category: string; items: string[] }[] = [
  { category: "Languages", items: ["JavaScript", "TypeScript", "HTML", "CSS"] },
  { category: "Frontend", items: ["Angular", "React", "Next.js", "Bootstrap", "Tailwind CSS"] },
  { category: "Backend", items: ["Node.js", "Express.js", "REST APIs"] },
  { category: "Databases", items: ["MongoDB", "PostgreSQL"] },
  { category: "Cloud & DevOps", items: ["AWS", "GCP", "Linux", "GitHub", "GitLab", "CI/CD"] },
  { category: "Practices", items: ["Microservices", "Agile", "Clean Architecture"] },
];

export type ExperienceEntry = {
  role: string;
  company: string;
  period: string;
  type?: string;
  bullets: string[];
};

export const experience: ExperienceEntry[] = [
  {
    role: "Web Developer",
    company: "Shyam Steel India",
    period: "Oct 2025 – Present",
    bullets: [
      "Own end-to-end delivery and ongoing enhancement of SFT Construct, SFT Travel Desk, SFT Vault, and SFTDox DMS following payroll transition from Shyam Future Tech Pvt. Ltd. to Shyam Steel India.",
      "Maintain and extend production modules across construction management, travel administration, asset lifecycle, and document management workflows.",
    ],
  },
  {
    role: "Web Developer",
    company: "Shyam Future Tech Pvt. Ltd.",
    period: "Mar 2024 – Oct 2025",
    bullets: [
      "Developed SFT Construct, a construction management module with real-time project tracking.",
      "Automated employee travel requests, approvals, and expense tracking through SFT Travel Desk.",
      "Built SFT Vault, a scalable asset lifecycle management system that reduced manual errors.",
      "Implemented SFTDox DMS, a secure document management system with version control and audit trails.",
    ],
  },
  {
    role: "Web Developer",
    company: "Ivan Infotech Pvt Ltd",
    period: "Sep 2022 – Mar 2024",
    bullets: [
      "Built responsive Angular front-end interfaces, boosting user engagement by 30%.",
      "Integrated Node.js and MongoDB backend services with efficient data handling.",
      "Extended application functionality through third-party API integrations.",
    ],
  },
  {
    role: "Full Stack Developer",
    company: "Seabrin Logistics Pvt Ltd",
    period: "Feb 2022 – Aug 2022",
    type: "Part-time",
    bullets: [
      "Spearheaded logistics software development, reducing operational costs by 20% and increasing efficiency by 30%.",
    ],
  },
  {
    role: "Software Development Intern",
    company: "Healthy Hearing Pvt Ltd",
    period: "Sep 2020 – Dec 2020",
    type: "Part-time",
    bullets: [
      "Contributed to software development projects and assigned tasks as part of the Software Development Team.",
    ],
  },
  {
    role: "Junior Web Developer",
    company: "PrasarNet Technologies",
    period: "Jul 2019 – Sep 2019",
    bullets: [
      "Worked on web consulting, development, and maintenance projects as part of the delivery team.",
    ],
  },
];

export type Project = {
  name: string;
  role: string;
  tech: string[];
  impact: string;
  tag: string;
};

export const projects: Project[] = [
  {
    name: "Enterprise ERP Software",
    role: "MEAN Stack Developer",
    tech: ["MongoDB", "Express.js", "Angular", "Node.js"],
    impact: "Designed and deployed ERP modules for finance, HR, and inventory, reducing manual reporting time by 40%.",
    tag: "Independent / Freelance",
  },
  {
    name: "RudrakshaValley.com",
    role: "Full Stack Developer",
    tech: ["Angular", "Node.js", "MongoDB", "Next.js"],
    impact: "Built a scalable eCommerce solution with secure payment integration and a responsive UI, increasing online sales conversion by 25%.",
    tag: "Independent / Freelance",
  },
  {
    name: "Logistics Scheduling & Tracking Software",
    role: "MEAN Stack Developer",
    tech: ["MongoDB", "Express.js", "Angular", "Node.js"],
    impact: "Architected transport scheduling and real-time tracking modules, reducing operational costs by 20% and improving delivery efficiency by 30%.",
    tag: "Independent / Freelance",
  },
  {
    name: "Audiometry Report Generation Software",
    role: "MEAN Stack Developer",
    tech: ["MongoDB", "Express.js", "Angular", "Node.js"],
    impact: "Automated audiometry test data processing and reporting, cutting report generation time from 2 hours to 15 minutes.",
    tag: "Independent / Freelance",
  },
];

export const education = [
  {
    degree: "B.Tech in Information Technology",
    school: "Kalyani Government Engineering College",
    period: "Jul 2019 – Jul 2022",
    detail: "CGPA: 8.74",
  },
  {
    degree: "Diploma in Electronics & Telecommunication Engineering",
    school: "Contai Polytechnic",
    period: "Jul 2016 – Jul 2019",
    detail: "CGPA: 8.00",
  },
];
