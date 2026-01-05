import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { Benefits } from "@/components/Benefits";
import { Brands } from "@/components/Brands";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Categories />
      <Benefits />
      <Brands />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
