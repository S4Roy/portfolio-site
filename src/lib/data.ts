// Single source of truth for portfolio content.
// Every figure here is taken from the ATS resume (docs/Subhankar_Roy_ATS_Resume.md)
// and the evidence log (docs/Resume_Project_Evidence.md). Do not add unverified numbers.

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://subhankarroy.in").replace(/\/$/, "");

// Bump when page content changes; drives sitemap <lastmod> and ProfilePage dateModified.
export const contentUpdated = "2026-11-26T00:00:00+05:30";

export const resumePath = "/Subhankar_Roy_Full_Stack_Developer_Resume.pdf";

export const profile = {
  name: "Subhankar Roy",
  firstName: "Subhankar",
  title: "Senior Full Stack Developer",
  headline: "Senior Full Stack Developer building reliable Node.js, TypeScript and React platforms.",
  location: "Kolkata, West Bengal, India",
  email: "subhankarroylive@gmail.com",
  phone: "+91 8906787168",
  whatsapp: "https://wa.me/918906787168",
  linkedin: "https://www.linkedin.com/in/s4roy/",
  github: "https://github.com/S4Roy/",
  availability: "Available to join immediately",
  workPreferences: "Open to remote and hybrid roles in Kolkata, Bengaluru, Hyderabad, Pune and Noida.",
  intro:
    "4+ years of full-time experience shipping enterprise workflows and production commerce: SAP-integrated travel and procurement systems for 2,500+ employees, a 93.75% faster document platform, and a multichannel store handling 600+ orders a month.",
  primaryStack: ["Node.js", "TypeScript", "React", "Next.js", "Angular", "MongoDB"],
};

export type Metric = { value: string; label: string; detail: string };

export const metrics: Metric[] = [
  { value: "4+ yrs", label: "Full-time experience", detail: "Plus earlier contract work since 2020" },
  { value: "2,500+", label: "Employees served", detail: "SFTravelDesk across 5 group companies" },
  { value: "93.75%", label: "Faster document loading", detail: "SFTDox: 8 minutes down to 30 seconds" },
  { value: "200+", label: "Procurement users", detail: "SFTNirman across 8 workflows" },
  { value: "600+", label: "Monthly orders", detail: "ELEXIFY web and Android commerce" },
  { value: "₹4L+", label: "Monthly sales", detail: "Processed through ELEXIFY checkout" },
];

export type Link = { label: string; href: string };

export type Project = {
  slug: string;
  name: string;
  summary: string;
  category: string;
  engagement: string;
  period?: string;
  role: string;
  responsibilities: string[];
  problem: string;
  implementation: string[];
  decisions: string[];
  outcomes: string[];
  tech: string[];
  links: Link[];
  image?: { src: string; alt: string };
  confidential?: boolean;
  caseStudy?: boolean;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    slug: "elexify",
    name: "ELEXIFY",
    summary: "Multichannel electronics commerce: Next.js storefront, Angular admin, Node.js API and an Android app.",
    category: "E-commerce platform",
    engagement: "Contract · Client project",
    period: "Jul 2024 – Present",
    role: "Lead Full Stack Developer (Contract)",
    responsibilities: [
      "Architecture and delivery of storefront, admin panel, REST API and Android app",
      "Checkout, inventory, payments, shipping and invoicing integrations",
      "Testing strategy, CI workflows and AWS deployment",
    ],
    problem:
      "A growing electronics retailer needed one platform for web and mobile sales where stock stays accurate under concurrent checkouts and payments are never double-processed, while operations staff manage orders, returns, invoicing and shipping from a single admin.",
    implementation: [
      "Next.js storefront, Angular admin panel and Express/Mongoose REST API sharing one MongoDB data model",
      "Android app on Google Play sharing the same API and checkout logic",
      "Razorpay, partial cash on delivery, refunds, Shiprocket and GST / Zoho Books invoicing",
      "Automated cart recovery and customer notifications",
      "AWS EC2 with PM2, Apache and SSL; S3 + CloudFront for media; GitHub Actions build and test workflows",
    ],
    decisions: [
      "MongoDB transactions with atomic stock updates and inventory reservations so the last unit cannot be sold twice",
      "Idempotent payment finalization that tolerates repeated or out-of-order gateway callbacks",
      "Approximately 170 granular RBAC permissions with audit logging for admin actions",
      "Automated checkout-concurrency and payment-reconciliation tests running in CI",
    ],
    outcomes: ["600+ orders per month", "₹4 lakh+ in monthly sales", "Web and Android channels on one backend"],
    tech: ["Next.js", "Angular", "Node.js", "Express.js", "MongoDB", "AWS", "GitHub Actions"],
    links: [
      { label: "Live storefront", href: "https://elexify.online/" },
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.elexify" },
    ],
    image: { src: "/projects/elexify.jpg", alt: "ELEXIFY storefront home page showing product categories and an inverter kits promotion" },
    caseStudy: true,
    featured: true,
  },
  {
    slug: "rudraksha-valley",
    name: "Rudraksha Valley",
    summary: "Customizable spiritual-goods store with a mala builder, multi-currency pricing and domestic + international checkout.",
    category: "E-commerce platform",
    engagement: "Contract · Client project",
    role: "Full Stack Developer (Contract)",
    responsibilities: [
      "Storefront and admin feature development",
      "Payment, shipping and currency integrations",
      "Technical SEO, analytics and CI",
    ],
    problem:
      "The store sells configurable products to domestic and international buyers, so it needed custom product building with validated pricing, local-currency display, multiple payment gateways and discoverability on search and shopping channels.",
    implementation: [
      "Catalog, variants, inventory, orders and CMS across a Next.js storefront and Angular admin on Express.js + MongoDB",
      "Mala builder with bead selection, quantity validation and server-side pricing",
      "GeoIP currency detection with exchange-rate conversion",
      "Unified Razorpay + PayPal checkout and automated Shiprocket shipment updates",
      "Guest carts and wishlists preserved through OTP sign-in",
    ],
    decisions: [
      "Prices recalculated and validated on the server for custom configurations instead of trusting the client",
      "Google Merchant Center feeds, dynamic sitemaps and structured data generated from catalog data",
      "GA4 e-commerce events covered by unit tests; Vitest / Supertest API tests in GitHub Actions CI",
      "S3-based image processing for optimized product media",
    ],
    outcomes: ["Two payment gateways in one checkout", "Domestic and international orders", "Merchant feeds and structured data live"],
    tech: ["Next.js", "Angular", "Node.js", "Express.js", "MongoDB", "AWS S3", "Razorpay", "PayPal", "Shiprocket"],
    links: [{ label: "Live storefront", href: "https://rudrakshavalley.com/" }],
    image: { src: "/projects/rudraksha-valley.jpg", alt: "Rudraksha Valley storefront hero advertising lab-certified rudraksha beads with currency selector" },
    caseStudy: true,
    featured: true,
  },
  {
    slug: "sftraveldesk",
    name: "SFTravelDesk",
    summary: "SAP-integrated travel and expense platform for 2,500+ employees across 5 group companies.",
    category: "Enterprise travel & expense",
    engagement: "Full-time · Shyam Future Tech / Shyam Steel",
    role: "MEAN Stack Developer",
    responsibilities: ["Feature development across approvals, expenses and reporting", "SAP integration", "Production support"],
    problem:
      "Travel requests, advances, expenses and reimbursements across five group companies needed one auditable digital workflow connected to SAP, with reporting at company level.",
    implementation: [
      "Angular frontend with Node.js / Express APIs and MongoDB",
      "Multi-step travel approval, advance, expense and reimbursement flows",
      "SAP integration and company-level reporting dashboards",
    ],
    decisions: ["Company-scoped data and reporting for a multi-entity group", "Role-based approval chains"],
    outcomes: ["2,500+ employees served", "5 group companies on one platform"],
    tech: ["Angular", "Node.js", "Express.js", "MongoDB", "SAP"],
    links: [{ label: "Product login", href: "https://sftraveldesk.com/" }],
    confidential: true,
    caseStudy: true,
    featured: true,
  },
  {
    slug: "sftnirman",
    name: "SFTNirman",
    summary: "Procurement suite covering 8 workflows from requisition to tender, integrated with SAP and TenderTiger.",
    category: "Enterprise procurement",
    engagement: "Full-time · Shyam Future Tech / Shyam Steel",
    role: "MEAN Stack Developer",
    responsibilities: ["Workflow architecture", "SAP and TenderTiger integrations", "BIM / 3D CAD review APIs"],
    problem:
      "Procurement ran across requisitions, RFQs, purchase orders, invoices and tenders that needed to connect to SAP and external tendering, with engineering design reviews in the same system.",
    implementation: [
      "8 procurement workflows from requisitions and RFQs to purchase orders, invoices and tenders",
      "SAP and TenderTiger integrations",
      "Node.js APIs for BIM and 3D CAD design management with review comments",
    ],
    decisions: ["Workflow modules sharing a common approval and audit model", "Integration boundaries kept behind dedicated API services"],
    outcomes: ["200+ users", "8 procurement workflows digitized"],
    tech: ["Angular", "Node.js", "Express.js", "MongoDB", "SAP", "TenderTiger"],
    links: [{ label: "Product login", href: "https://sftnirman.com/" }],
    confidential: true,
    caseStudy: true,
    featured: true,
  },
  {
    slug: "sftdox",
    name: "SFTDox",
    summary: "Document collaboration platform: dashboards, annotations and a 93.75% cut in load time.",
    category: "Document management",
    engagement: "Full-time · Shyam Future Tech / Shyam Steel",
    role: "MEAN Stack Developer",
    responsibilities: ["Performance optimization", "Dashboards, annotations and collaboration features"],
    problem: "Large documents took around 8 minutes to load, blocking day-to-day review and collaboration.",
    implementation: ["Upgraded dashboards, annotations and collaboration", "Reworked document loading path"],
    decisions: ["Profiled the loading path end to end before optimizing"],
    outcomes: ["Load time reduced from 8 minutes to 30 seconds (93.75%)"],
    tech: ["Angular", "Node.js", "MongoDB"],
    links: [{ label: "Demo", href: "https://demo.sftdox.com/" }],
    confidential: true,
  },
  {
    slug: "sftvault",
    name: "SFTVault",
    summary: "Asset management application built in Next.js for internal operations.",
    category: "Asset management",
    engagement: "Full-time · Shyam Future Tech / Shyam Steel",
    role: "MEAN Stack Developer",
    responsibilities: ["Application build in Next.js"],
    problem: "Company assets needed a dedicated tracking and management application.",
    implementation: ["Next.js application for asset management"],
    decisions: [],
    outcomes: [],
    tech: ["Next.js", "React", "Node.js"],
    links: [{ label: "Staging", href: "https://staging.sftvault.com" }],
    confidential: true,
  },
  {
    slug: "sftwarehouse",
    name: "SFTWarehouse",
    summary: "Single sign-on platform giving group companies one company-scoped login across internal applications.",
    category: "Identity & SSO",
    engagement: "Full-time · Shyam Future Tech / Shyam Steel",
    role: "MEAN Stack Developer",
    responsibilities: ["Platform build in Angular", "SSO integration with group applications"],
    problem: "Employees across group companies needed one secure, company-scoped sign-in instead of separate credentials for each internal app.",
    implementation: ["Angular SSO portal with company verification before login", "Shared authentication for internal applications"],
    decisions: [],
    outcomes: [],
    tech: ["Angular", "Node.js", "SSO", "RBAC"],
    links: [{ label: "SSO portal", href: "https://sso.sftwarehouse.com/auth/login" }],
    confidential: true,
  },
  {
    slug: "signlix",
    name: "SignLix",
    summary: "E-signature workflows with signer ordering, signature placement and eMudra Aadhaar-based signing.",
    category: "E-signature SaaS",
    engagement: "Full-time · Ivan Infotech",
    role: "MEAN Stack Developer",
    responsibilities: ["Document and signer workflows", "eMudra integration"],
    problem: "Teams needed to send documents for legally recognised signing with controlled order and tracking.",
    implementation: [
      "Document uploads, signer management, signing order and signature placement",
      "Email requests and status tracking",
      "eMudra Aadhaar-based eSign integration",
    ],
    decisions: [],
    outcomes: [],
    tech: ["Angular", "Node.js", "Express.js", "MongoDB", "eMudra"],
    links: [],
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const caseStudies = projects.filter((p) => p.caseStudy);
export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export type SkillGroup = { category: string; description: string; items: string[] };

export const skills: SkillGroup[] = [
  {
    category: "Backend Engineering",
    description: "APIs, auth and integrations",
    items: ["Node.js", "Express.js", "REST API design", "Authentication (OTP, Google, SSO)", "RBAC", "Audit logging"],
  },
  {
    category: "Frontend Engineering",
    description: "Web and mobile interfaces",
    items: ["TypeScript", "React", "Next.js", "Angular", "RxJS", "NgRx", "Tailwind CSS"],
  },
  {
    category: "Databases",
    description: "Data modelling and consistency",
    items: ["MongoDB", "Mongoose", "MongoDB transactions", "PostgreSQL", "Firebase"],
  },
  {
    category: "Cloud & DevOps",
    description: "Deployment and operations",
    items: ["AWS EC2 / S3 / CloudFront", "GCP", "Docker", "Linux", "GitHub Actions CI/CD", "PM2", "Apache", "SSL/TLS", "Shell scripting"],
  },
  {
    category: "Testing",
    description: "Confidence before release",
    items: ["Jest", "Vitest", "Supertest", "Unit & integration tests", "API testing"],
  },
  {
    category: "Integrations",
    description: "Enterprise and commerce",
    items: ["SAP", "TenderTiger", "Razorpay", "PayPal", "Shiprocket", "Zoho Books", "eMudra", "Google Maps"],
  },
];

export type ExperienceEntry = {
  role: string;
  company: string;
  period: string;
  location?: string;
  note?: string;
  highlights: string[];
  details: string[];
  links?: Link[];
};

export type ExperienceGroup = { title: string; entries: ExperienceEntry[] };

export const experienceGroups: ExperienceGroup[] = [
  {
    title: "Full-time",
    entries: [
      {
        role: "MEAN Stack Developer",
        company: "Shyam Future Tech Pvt. Ltd / Shyam Steel Industries Ltd",
        period: "Mar 2024 – Oct 2026",
        location: "Kolkata",
        note: "Joined Shyam Future Tech on 7 Mar 2024; transitioned to Shyam Steel Industries on 31 Oct 2025 with the same product responsibilities through 31 Oct 2026.",
        highlights: [
          "Architected SFTNirman procurement for 200+ users across 8 workflows with SAP and TenderTiger integration.",
          "Launched SAP-integrated SFTravelDesk for 2,500+ employees across 5 group companies.",
          "Cut SFTDox document loading by 93.75%, from 8 minutes to 30 seconds.",
        ],
        details: [
          "Built Node.js APIs for BIM and 3D CAD design management with review comments.",
          "Implemented SFTVault asset management in Next.js.",
          "Established SFTWarehouse, an Angular single sign-on platform for group applications.",
          "Integrated a React AI-chatbot frontend into the Angular-based SFT Evolve HRMS.",
          "Delivered an Angular/Node.js appraisal solution for Andrew Yule & Company and an Angular storefront for UK-based Scaffold Mart.",
          "Resolved frontend, API and database issues and automated manual processes within Agile teams.",
        ],
        links: [
          { label: "SFTravelDesk", href: "https://sftraveldesk.com/" },
          { label: "SFTNirman", href: "https://sftnirman.com/" },
          { label: "SFTWarehouse SSO", href: "https://sso.sftwarehouse.com/auth/login" },
          { label: "SFTDox (demo)", href: "https://demo.sftdox.com/" },
          { label: "SFT Evolve (demo)", href: "https://demo.sftevolve.com/" },
          { label: "SFTVault (staging)", href: "https://staging.sftvault.com" },
          { label: "Scaffold Mart", href: "http://scaffoldmart.co.uk/" },
          { label: "Andrew Yule intranet", href: "https://ayule.andrewyule.in/intranet" },
        ],
      },
      {
        role: "MEAN Stack Developer",
        company: "Ivan Infotech Pvt. Ltd",
        period: "Sep 2022 – Mar 2024",
        location: "Kolkata",
        highlights: [
          "Built SignLix e-signature workflows with eMudra Aadhaar-based signing.",
          "Engineered Angular modules, REST APIs and MongoDB services for CalGamesWanted.",
        ],
        details: [
          "CalGamesWanted is a sports scheduling platform for coaches and athletic directors at California high schools.",
          "SignLix: uploads, signer management, signing order, signature placement, email requests and tracking.",
          "Expanded Vrasio property search, filters and booking flows with Google Maps Place ID support.",
                  ],
        links: [
          { label: "CalGamesWanted", href: "https://application.calgameswanted.com/" },
          { label: "Vrasio", href: "https://vrasio.com/" },
        ],
      },
    ],
  },
  {
    title: "Earlier contracts",
    entries: [
      {
        role: "Full Stack Developer",
        company: "Seabrin Logistics Pvt. Ltd",
        period: "Feb 2021 – Aug 2022",
        location: "Sodpur",
        highlights: ["Delivered a MEAN-stack logistics platform for Kolkata–Assam freight operations."],
        details: [
          "Vendor bidding and selection, trip tracking, and vehicle/trip contracts with daily cost calculation.",
          "Contributed to product administration and order workflows for a Next.js / React electronics store.",
          "Current platform footprint (Nov 2026 dashboard): 5,716 trips, 30,538 fixed-trip records and 355 vendors.",
        ],
        links: [{ label: "Seabrin LMS", href: "https://lms.seabrin.in/" }],
      },
      {
        role: "Full Stack Developer",
        company: "Healthy Hearing Pvt. Ltd",
        period: "Jan 2020 – Dec 2020",
        location: "Barrackpore",
        highlights: ["Cut audiometry report preparation from 10–15 minutes to 2–3 minutes."],
        details: [
          "Angular, Node.js, Express.js and MongoDB with role-based access for administrators and audiologists.",
          "Automated audiogram plotting, pure-tone averages and report recommendations.",
          "Current deployment (Nov 2026 dashboard): 7,766 patient records across 2 centers with 5 audiologists.",
        ],
        links: [
          { label: "Healthy Hearing", href: "https://hh.baseweb.in/" },
          { label: "BRRPL audiometry", href: "https://brrpl.audio.baseweb.in/" },
        ],
      },
    ],
  },
  {
    title: "Client projects (contract)",
    entries: [
      {
        role: "Full Stack Developer (Contract)",
        company: "ELEXIFY and Rudraksha Valley",
        period: "Jul 2024 – Present",
        highlights: [
          "ELEXIFY: web + Android commerce handling 600+ monthly orders and ₹4 lakh+ monthly sales.",
          "Rudraksha Valley: configurable products, multi-currency and dual-gateway checkout.",
        ],
        details: ["See the case studies above for architecture and engineering decisions."],
        links: [
          { label: "ELEXIFY", href: "https://elexify.online/" },
          { label: "Rudraksha Valley", href: "https://rudrakshavalley.com/" },
        ],
      },
    ],
  },
];

export const aiPractices: { title: string; body: string }[] = [
  { title: "Feature implementation", body: "Claude Code and OpenAI Codex draft scaffolding and repetitive code from a written plan; I design the approach and review every change." },
  { title: "Refactoring & debugging", body: "Used to trace unfamiliar code paths and propose refactors, which I verify against tests and behaviour before merging." },
  { title: "Test generation", body: "Drafting edge-case and integration tests, such as checkout concurrency scenarios, then tightening assertions by hand." },
  { title: "Code review assistance", body: "A second reviewer for diffs, catching missed cases. Final judgement and ownership stay with me." },
  { title: "Documentation", body: "Turning implementation notes into READMEs, deployment guides and API docs that I edit for accuracy." },
  { title: "AI chatbot frontend", body: "Integrated a React AI-chatbot frontend into the Angular-based SFT Evolve HRMS used by employees." },
];

export const aiPrinciples = [
  "Human validation of every generated change",
  "No secrets, credentials or proprietary data in prompts",
  "Tests and CI as the gate, not the assistant",
  "Full code ownership and accountability",
];

export const education = [
  { degree: "B.Tech, Information Technology", school: "Kalyani Government Engineering College", period: "2019 – 2022", detail: "CGPA 8.74" },
  { degree: "Diploma, Electronics & Telecommunication", school: "Contai Polytechnic", period: "2016 – 2019", detail: "CGPA 8.0" },
];
