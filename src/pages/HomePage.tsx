import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CtaSection from "@/components/landing/CtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <TestimonialsSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
