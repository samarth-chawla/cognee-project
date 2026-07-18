import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";

import Navbar from "@/components/landing-page/Navbar";
import HeroSection from "@/components/landing-page/HeroSection";
import SocialProofSection from "@/components/landing-page/SocialProofSection";
import CoreFeaturesSection from "@/components/landing-page/CoreFeaturesSection";
import InteractiveDemoSection from "@/components/landing-page/InteractiveDemoSection";
import HowItWorksSection from "@/components/landing-page/HowItWorksSection";
import PricingSection from "@/components/landing-page/PricingSection";
import FaqSection from "@/components/landing-page/FaqSection";
import Footer from "@/components/landing-page/Footer";

export default async function Home() {
  const { userId: clerkId } = await auth();

  let setupDone = false;
  if (clerkId) {
    const profile = await prisma.userProfile.findFirst({
      where: {
        user: {
          clerkId: clerkId,
        },
      },
    });
    setupDone = !!profile;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center overflow-x-hidden font-sans relative">
      <Navbar clerkId={clerkId} setupDone={setupDone} />
      <HeroSection clerkId={clerkId} setupDone={setupDone} />
      <SocialProofSection />
      <CoreFeaturesSection />
      <InteractiveDemoSection />
      <HowItWorksSection />
      <PricingSection clerkId={clerkId} setupDone={setupDone} />
      <FaqSection />
      <Footer />
    </div>
  );
}
