import Navbar from '@/components/lumina/Navbar';
import Hero from '@/components/lumina/Hero';
import Stats from '@/components/lumina/Stats';
import Solution from '@/components/lumina/Solution';
import Features from '@/components/lumina/Features';
import Clients from '@/components/lumina/Clients';
import Testimonials from '@/components/lumina/Testimonials';
import Integrations from '@/components/lumina/Integrations';
import Pricing from '@/components/lumina/Pricing';
import FAQ from '@/components/lumina/FAQ';
import BlogPreview from '@/components/lumina/BlogPreview';
import Purpose from '@/components/lumina/Purpose';
import CTA from '@/components/lumina/CTA';
import Footer from '@/components/lumina/Footer';

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-primary/30 selection:text-primary-foreground">
      {/* Sleek top-center glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Sleek radial background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.02)_0%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10">
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
      </div>
    </main>
  );
};

export default Index;
