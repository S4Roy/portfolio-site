import { JsonLd, profilePageJsonLd } from "@/lib/seo";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Impact from "@/components/Impact";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import Experience from "@/components/Experience";
import AIEngineering from "@/components/AIEngineering";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <JsonLd data={profilePageJsonLd()} />
      <Nav />
      <main id="main" className="flex-1">
        <Hero />
        <Impact />
        <Projects />
        <Skills />
        <Experience />
        <AIEngineering />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
