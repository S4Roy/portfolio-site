export const profile = {
  name: "Subhankar Roy",
  title: "Full Stack Developer",
  tagline: "4+ years full-time · 6+ years including contracts",
  location: "Kolkata, West Bengal, India",
  email: "subhankarroylive@gmail.com",
  phone: "+91 8906787168",
  whatsapp: "https://wa.me/918906787168",
  linkedin: "https://www.linkedin.com/in/s4roy/",
  github: "https://github.com/S4Roy/",
  availability: "Immediate joiner",
  workPreferences: "Open to remote roles and hybrid roles in Kolkata, Bengaluru, Hyderabad, Pune and Noida.",
  summary:
    "Full Stack Developer specializing in Angular, TypeScript, Node.js, Express.js and MongoDB. Built enterprise procurement, travel, document-management and e-commerce systems, including SFTravelDesk for 2,500+ employees across 5 group companies. Integrated SAP and TenderTiger workflows, improved document load time by 93.75%, and delivered production commerce platforms across web and mobile.",
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

export const highlights = [
  { value: "200+", label: "SFTNirman users", detail: "Across 8 procurement workflows" },
  { value: "93.75%", label: "Faster document loading", detail: "8 minutes to 30 seconds in SFTDox" },
  { value: "Web + mobile", label: "Production commerce", detail: "ELEXIFY storefront, admin and Android app" },
];

export const skills: { category: string; items: string[] }[] = [
  { category: "Languages", items: ["TypeScript", "JavaScript (ES6+)", "HTML5", "CSS3"] },
  { category: "Frontend & Mobile", items: ["Angular", "RxJS", "NgRx", "React", "Next.js", "React Native", "Expo", "Tailwind CSS", "Bootstrap", "Responsive Web Design"] },
  { category: "Backend & Security", items: ["Node.js", "Express.js", "REST APIs", "Electron.js", "OTP & Google Authentication", "SSO", "RBAC"] },
  { category: "Databases", items: ["MongoDB", "Mongoose", "PostgreSQL", "Firebase"] },
  { category: "Cloud & DevOps", items: ["AWS EC2 / S3 / CloudFront", "GCP", "Linux", "Shell Scripting", "Docker", "CI/CD", "Apache", "PM2", "SSL/TLS", "Git", "GitHub", "GitLab"] },
  { category: "Enterprise & Commerce", items: ["ERP", "Procurement & Tenders", "BIM / 3D CAD", "Document & Asset Management", "eSign", "Inventory", "Orders & Returns", "GST Invoicing", "CMS / SEO", "Audit Logging"] },
  { category: "Integrations", items: ["SAP", "TenderTiger", "Razorpay", "PayPal", "Stripe", "Square", "Shiprocket", "Zoho Books", "eMudra", "Google Maps Place ID", "Fast2SMS", "BulkSMSPlans", "Twilio", "100SMS", "MSG91", "Email / Push / WhatsApp"] },
  { category: "Testing & Delivery", items: ["Vitest", "Supertest", "Playwright", "Jest", "Cypress", "Mocha", "Unit & API Testing", "Debugging", "Agile / Scrum", "Code Reviews"] },
  { category: "AI-Assisted Development", items: ["Claude Code", "OpenAI Codex"] },
];

export type ExperienceEntry = {
  role: string;
  company: string;
  period: string;
  type?: string;
  bullets: string[];
  links?: { label: string; href: string }[];
};

export const experience: ExperienceEntry[] = [
  {
    role: "MEAN Stack Developer",
    company: "Shyam Future Tech Pvt. Ltd / Shyam Steel Industries Ltd",
    links: [
      { label: "SFTravelDesk", href: "https://sftraveldesk.com/" },
      { label: "SFTNirman", href: "https://sftnirman.com/" },
      { label: "SFTWarehouse SSO", href: "https://sso.sftwarehouse.com/" },
      { label: "SFTDox (demo)", href: "https://demo.sftdox.com/" },
      { label: "SFT Evolve (demo)", href: "https://demo.sftevolve.com/" },
      { label: "SFTVault (staging)", href: "https://staging.sftvault.com" },
      { label: "Scaffold Mart", href: "http://scaffoldmart.co.uk/" },
      { label: "Andrew Yule intranet", href: "https://ayule.andrewyule.in/intranet" },
    ],
    period: "7 Mar 2024 – 31 Oct 2026",
    bullets: [
      "Joined Shyam Future Tech Pvt. Ltd on 7 Mar 2024 and transitioned to Shyam Steel Industries Ltd on 31 Oct 2025, continuing through 31 Oct 2026. Owned development and production support for procurement, travel, asset-management and document-collaboration applications.",
      "Architected SFTNirman for 200+ users across 8 procurement workflows, from requisitions and RFQs to purchase orders, invoices and tenders; integrated SAP and TenderTiger.",
      "Built BIM and 3D CAD design management with review comments and Node.js APIs, and launched SAP-integrated SFTravelDesk for 2,500+ employees across 5 group companies, digitizing travel approvals, expenses, advances and reimbursements with company-level reporting.",
      "Implemented SFTVault in Next.js and upgraded SFTDox dashboards, annotations and collaboration, reducing document loading from 8 minutes to 30 seconds (93.75%).",
      "Established SFTWarehouse, an Angular 21 SSO platform, and integrated a React AI-chatbot frontend into the Angular-based SFT Evolve HRMS.",
      "Developed an Angular/Node.js appraisal solution for Andrew Yule & Company and the Angular 18 storefront for UK-based Scaffold Mart.",
      "Resolved frontend, API and database issues, optimized API responses and automated manual processes within Agile delivery teams.",
    ],
  },
  {
    role: "MEAN Stack Developer",
    company: "Ivan Infotech Pvt. Ltd",
    links: [
      { label: "CalGamesWanted", href: "https://application.calgameswanted.com/" },
      { label: "SignLix", href: "https://signlix.com/" },
      { label: "Vrasio", href: "https://vrasio.com/" },
    ],
    period: "5 Sep 2022 – 6 Mar 2024",
    bullets: [
      "Engineered Angular modules, REST APIs and MongoDB services for CalGamesWanted, a California high-school sports scheduling platform for coaches and athletic directors.",
      "Built SignLix e-signature workflows for uploads, signer management, signing order, signature placement, email requests and tracking; integrated eMudra Aadhaar-based signing.",
      "Expanded Vrasio vacation-rental and hotel-booking flows, including listings, search, filters and Google Maps Place ID support.",
      "Developed an Electron.js desktop application with web-platform data synchronization, reusable Angular components, request handling and validation.",
    ],
  },
  {
    role: "Full Stack Developer",
    company: "Seabrin Logistics Pvt. Ltd",
    links: [
      { label: "Seabrin LMS", href: "https://lms.seabrin.in/" },
    ],
    period: "Feb 2021 – Aug 2022",
    type: "Part-time contract",
    bullets: [
      "Built a MEAN-stack logistics system for long-haul freight between Kolkata and Assam. Current platform footprint: 5,716 trips, 30,538 fixed-trip records and 355 vendors.",
      "Designed vendor bidding and selection, loading/unloading/transit tracking, and fixed-vehicle and fixed-trip contracts with configurable dates and per-day costing.",
      "Contributed to a Next.js and React electronics e-commerce platform covering product administration, listings and order workflows.",
    ],
  },
  {
    role: "Full Stack Developer",
    company: "Healthy Hearing Pvt. Ltd",
    links: [
      { label: "Healthy Hearing", href: "https://hh.baseweb.in/" },
      { label: "BRRPL audiometry", href: "https://brrpl.audio.baseweb.in/" },
    ],
    period: "Jan 2020 – Dec 2020",
    type: "Part-time contract",
    bullets: [
      "Developed Angular, Node.js, Express.js and MongoDB audiometry-report software with role-based access. Current deployment tracks 7,766 patient records across 2 centers with 5 audiologists.",
      "Automated audiogram plotting and pure-tone average calculations, including report suggestions and recommendations.",
      "Reduced report preparation from 10–15 minutes to 2–3 minutes through software-based frequency plotting.",
    ],
  },
];

export type Project = {
  name: string;
  role: string;
  tech: string[];
  impact: string;
  tag: string;
  period?: string;
  links?: { label: string; href: string }[];
};

export const projects: Project[] = [
  {
    name: "ELEXIFY — Multi-channel Commerce",
    period: "Jul 2024 – Present",
    links: [
      { label: "Visit storefront", href: "https://elexify.online/" },
      { label: "Google Play", href: "https://play.google.com/store/apps/details?id=com.elexify" },
    ],
    role: "Full Stack Developer · Web & Mobile",
    tech: ["Next.js", "Angular", "Node.js", "React Native", "AWS"],
    impact: "Built a Next.js storefront, Angular admin panel, Node.js/Express API and React Native/Expo Android app supporting 600+ monthly orders and ₹4 lakh+ in monthly sales. Implemented transactional MongoDB inventory, stock reservations and idempotent checkout/payment finalization. Integrated Razorpay, partial-COD, returns/refunds, Shiprocket, GST invoicing and Zoho Books. Added RBAC with approximately 170 permissions, audit logging, cart recovery and notifications. Implemented Vitest/Supertest API tests, Playwright checkout/returns tests and Jest mobile tests; deployed on AWS with GitHub Actions build/test workflows.",
    tag: "Freelance · Part-time",
  },
  {
    name: "Rudraksha Valley — E-commerce",
    links: [{ label: "Visit storefront", href: "https://rudrakshavalley.com/" }],
    role: "Full Stack Developer",
    tech: ["Next.js", "Angular", "Node.js", "MongoDB", "Razorpay", "PayPal", "Shiprocket"],
    impact: "Extended a Next.js storefront and Angular admin panel with Node.js/Express APIs and MongoDB for catalog, variants, inventory, orders and CMS. Implemented a custom mala builder, GeoIP-based currency detection, exchange-rate conversion, OTP login and guest-cart transfer. Integrated 2 payment gateways (Razorpay and PayPal) and Shiprocket serviceability/status webhooks for domestic and international checkout and automated shipment updates. Added Google Merchant feeds, dynamic sitemaps, structured data, GA4 commerce events, S3 image optimization, automated tests and GitHub Actions CI workflows.",
    tag: "Freelance · Part-time",
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
