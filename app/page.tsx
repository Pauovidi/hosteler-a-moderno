import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Categories } from "@/components/categories";
import { Benefits } from "@/components/benefits";
import { Brands } from "@/components/brands";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Categories />
      <Benefits />
      <Brands />
      <CTA />
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
