import Navbar from "@/components/lumina/Navbar";
import Hero from "@/components/lumina/Hero";
import Stats from "@/components/lumina/Stats";
import Solution from "@/components/lumina/Solution";
import Features from "@/components/lumina/Features";
import Clients from "@/components/lumina/Clients";
import Testimonials from "@/components/lumina/Testimonials";
import Integrations from "@/components/lumina/Integrations";
import Pricing from "@/components/lumina/Pricing";
import FAQ from "@/components/lumina/FAQ";
import BlogPreview from "@/components/lumina/BlogPreview";
import Purpose from "@/components/lumina/Purpose";
import CTA from "@/components/lumina/CTA";
import Footer from "@/components/lumina/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <Stats />
      <Solution />
      <Features />
      <Clients />
      <Testimonials />
      <Integrations />
      <Pricing />
      <FAQ />
      <BlogPreview />
      <Purpose />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
