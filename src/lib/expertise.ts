// Expertise landing pages. Content is drawn only from verified resume facts
// (docs/Subhankar_Roy_ATS_Resume.md). Projects are matched by `tech` in data.ts.

export type Expertise = {
  slug: string;
  name: string; // technology name as used in project `tech` arrays
  title: string; // H1 / primary keyword
  metaTitle: string;
  description: string;
  intro: string[];
  capabilities: string[];
  matchTech: string[]; // project tech names that count for this page
  related: string[]; // other expertise slugs
};

export const expertise: Expertise[] = [
  {
    slug: "nodejs",
    name: "Node.js",
    title: "Node.js Developer in Kolkata",
    metaTitle: "Node.js Developer in Kolkata | Subhankar Roy",
    description:
      "Subhankar Roy is a Node.js developer in Kolkata building Express.js REST APIs, SAP integrations, transactional checkout and RBAC for enterprise and e-commerce platforms. 4+ years experience.",
    intro: [
      "Node.js and Express.js are the backbone of most systems I have shipped over 4+ years of full-time work: procurement and travel platforms for enterprise users, document and e-signature workflows, and commerce APIs handling real orders and payments.",
      "My focus is correctness under load: transactional data changes, idempotent payment handling, role-based access control and integrations that keep working in production.",
    ],
    capabilities: [
      "RESTful API design with Express.js and Mongoose",
      "MongoDB transactions, atomic stock updates and inventory reservations",
      "Idempotent payment finalization for repeated gateway callbacks",
      "SAP and TenderTiger integrations for enterprise procurement and travel",
      "Authentication (SSO, OTP, OAuth) and granular RBAC with audit logging",
      "Node.js APIs for BIM / 3D CAD design management and reviews",
      "API and concurrency testing with Jest, Vitest and Supertest",
      "Deployment on AWS EC2 with PM2, Apache and GitHub Actions CI",
    ],
    matchTech: ["Node.js", "Express.js"],
    related: ["mean-stack", "mern-stack", "nextjs"],
  },
  {
    slug: "angular",
    name: "Angular",
    title: "Angular Developer in Kolkata",
    metaTitle: "Angular Developer in Kolkata | Subhankar Roy",
    description:
      "Subhankar Roy is an Angular developer in Kolkata with 4+ years building enterprise Angular applications: procurement, travel, SSO, admin panels and e-signature workflows with RxJS and NgRx.",
    intro: [
      "Angular is the frontend I have used most across enterprise work: SAP-integrated procurement and travel systems, a single sign-on platform for group companies, document collaboration, e-signature flows and commerce admin panels.",
      "I build modular, maintainable Angular applications with RxJS and NgRx, reusable components and clear separation between UI and API services.",
    ],
    capabilities: [
      "Enterprise Angular applications with RxJS and NgRx",
      "Angular single sign-on (SSO) platform for multiple group companies",
      "Multi-step approval, expense and reimbursement workflows",
      "Commerce admin panels: catalog, inventory, orders, returns and RBAC",
      "Dashboards, annotations and document collaboration features",
      "Integrating a React AI-chatbot frontend into an Angular HRMS",
      "Reusable component libraries and form validation",
    ],
    matchTech: ["Angular"],
    related: ["mean-stack", "nodejs", "react"],
  },
  {
    slug: "react",
    name: "React",
    title: "React Developer in Kolkata",
    metaTitle: "React Developer in Kolkata | Subhankar Roy",
    description:
      "Subhankar Roy is a React developer in Kolkata building React and Next.js storefronts, asset management apps and AI-chatbot frontends backed by Node.js APIs. 4+ years full stack experience.",
    intro: [
      "I use React, mostly through Next.js, for customer-facing storefronts and internal tools, always paired with a Node.js backend I also own.",
      "Recent React work includes production commerce storefronts, a Next.js asset management application and a React AI-chatbot frontend embedded into an Angular HRMS.",
    ],
    capabilities: [
      "React and Next.js storefronts with checkout and payments",
      "Product configuration UI with server-validated pricing",
      "React AI-chatbot frontend integrated into an existing Angular app",
      "Asset management application in Next.js",
      "Guest cart and wishlist persistence through OTP sign-in",
      "TypeScript, Tailwind CSS and accessible, responsive UI",
    ],
    matchTech: ["React", "Next.js"],
    related: ["nextjs", "mern-stack", "nodejs"],
  },
  {
    slug: "nextjs",
    name: "Next.js",
    title: "Next.js Developer in Kolkata",
    metaTitle: "Next.js Developer in Kolkata | Subhankar Roy",
    description:
      "Subhankar Roy is a Next.js developer in Kolkata shipping SEO-ready Next.js storefronts with structured data, merchant feeds, sitemaps and GA4, backed by Node.js and MongoDB.",
    intro: [
      "Next.js is my choice for public-facing products where search visibility and performance matter. I have shipped Next.js commerce storefronts in production and built internal applications with it.",
      "Beyond the UI, I handle the technical SEO that makes Next.js worthwhile: structured data, dynamic sitemaps, merchant feeds and analytics events.",
    ],
    capabilities: [
      "Next.js storefronts handling 600+ monthly orders",
      "Google Merchant Center feeds, dynamic sitemaps and structured data",
      "GA4 e-commerce event tracking with automated tests",
      "Multi-currency pricing with GeoIP detection",
      "Server-rendered pages backed by Express.js and MongoDB APIs",
      "Next.js asset management application for internal operations",
    ],
    matchTech: ["Next.js"],
    related: ["react", "mern-stack", "nodejs"],
  },
  {
    slug: "mean-stack",
    name: "MEAN Stack",
    title: "MEAN Stack Developer in Kolkata",
    metaTitle: "MEAN Stack Developer in Kolkata | Subhankar Roy",
    description:
      "Subhankar Roy is a MEAN stack developer in Kolkata (MongoDB, Express.js, Angular, Node.js) with enterprise procurement, travel, e-signature, logistics and healthcare reporting systems.",
    intro: [
      "MongoDB, Express.js, Angular and Node.js is the stack behind most of my career, from early contract work on logistics and audiometry reporting to enterprise platforms used by thousands of employees.",
      "I own MEAN applications end to end: data modelling, API design, Angular frontends, integrations and production support.",
    ],
    capabilities: [
      "SAP-integrated travel and expense platform for 2,500+ employees",
      "Procurement suite for 200+ users across 8 workflows",
      "Document platform load time cut by 93.75% (8 minutes to 30 seconds)",
      "E-signature workflows with eMudra Aadhaar-based signing",
      "Logistics platform with vendor bidding, trip tracking and cost calculation",
      "Audiometry reporting that cut report preparation from 10–15 to 2–3 minutes",
    ],
    matchTech: ["Angular", "Node.js", "MongoDB"],
    related: ["angular", "nodejs", "mern-stack"],
  },
  {
    slug: "mern-stack",
    name: "MERN Stack",
    title: "MERN Stack Developer in Kolkata",
    metaTitle: "MERN Stack Developer in Kolkata | Subhankar Roy",
    description:
      "Subhankar Roy is a MERN stack developer in Kolkata building React / Next.js frontends on Node.js, Express.js and MongoDB, including commerce handling 600+ monthly orders and ₹4L+ monthly sales.",
    intro: [
      "On the MERN side I build React and Next.js frontends on Express.js and MongoDB backends, most notably production commerce platforms where reliability directly affects revenue.",
      "The engineering emphasis is the backend: consistent inventory under concurrent checkouts, replay-safe payments and tested integrations.",
    ],
    capabilities: [
      "React / Next.js storefronts on Express.js and MongoDB",
      "600+ monthly orders and ₹4 lakh+ monthly sales on one platform",
      "Concurrent checkout with MongoDB transactions and stock reservations",
      "Razorpay, PayPal, Shiprocket and GST / Zoho Books integrations",
      "Approximately 170 RBAC permissions with audit logging",
      "Automated tests and GitHub Actions CI; AWS deployment",
    ],
    matchTech: ["Next.js", "React", "Node.js", "MongoDB"],
    related: ["nextjs", "react", "nodejs"],
  },
];

export const getExpertise = (slug: string) => expertise.find((e) => e.slug === slug);
