import { Header } from "@/components/layout";
import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { CliSection } from "@/components/sections/cli-section";
import { CtaSection } from "@/components/sections/cta-section";

export default function Home() {
  return (
    <div className="scroll-snap-container bg-grid-static">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <CliSection />
      <CtaSection />
    </div>
  );
}
