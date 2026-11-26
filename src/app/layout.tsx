import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { profile, siteUrl } from "@/lib/data";
import { JsonLd, seo, siteJsonLd } from "@/lib/seo";
import Analytics from "@/components/Analytics";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: seo.title, template: "%s | Subhankar Roy" },
  description: seo.description,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  applicationName: profile.name,
  category: "technology",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    siteName: profile.name,
    title: seo.title,
    description: seo.description,
    locale: "en_IN",
    firstName: "Subhankar",
    lastName: "Roy",
  },
  twitter: { card: "summary_large_image", title: seo.title, description: seo.description },
  // Google Search Console HTML-tag verification (optional; DNS verification needs no code).
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

// Runs before paint to apply the saved/system theme and avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <JsonLd data={siteJsonLd()} />
      </head>
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only z-[60] rounded-md bg-accent px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        {children}
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
