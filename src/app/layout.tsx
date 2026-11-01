import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { profile } from "@/lib/data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const title = "Subhankar Roy | Full Stack Developer";
const description =
  "Subhankar Roy — Full Stack Developer with 4+ years of full-time experience and 6+ years including contracts. Angular, TypeScript, Node.js and MongoDB; enterprise applications, e-commerce and mobile. Immediate joiner based in Kolkata.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Subhankar Roy",
  },
  description,
  keywords: [
    "Subhankar Roy",
    "Full Stack Developer",
    "Angular Developer",
    "Node.js Developer",
    "MEAN Stack Developer",
    "React Developer",
    "Next.js Developer",
    "MongoDB",
    "TypeScript",
    "West Bengal Developer",
    "India Full Stack Developer",
  ],
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  applicationName: "Subhankar Roy Portfolio",
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "profile",
    url: siteUrl,
    siteName: `${profile.name} — Portfolio`,
    title,
    description,
    locale: "en_US",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: `${profile.name} — Full Stack Developer`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/icon.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.title,
    url: siteUrl,
    email: `mailto:${profile.email}`,
    address: {
      "@type": "PostalAddress",
      addressRegion: "West Bengal",
      addressCountry: "IN",
    },
    sameAs: [profile.linkedin, profile.github],
    knowsAbout: [
      "Angular",
      "React",
      "Next.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "PostgreSQL",
      "TypeScript",
      "REST APIs",
      "Microservices",
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
