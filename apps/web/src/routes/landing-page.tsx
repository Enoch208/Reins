import { lazy, Suspense, useRef } from "react";
import { ChainSection } from "@/components/landing/sections/chain-section";
import { ClosingSection } from "@/components/landing/sections/closing-section";
import { ConsoleSection } from "@/components/landing/sections/console-section";
import { FailuresSection } from "@/components/landing/sections/failures-section";
import { FaqSection } from "@/components/landing/sections/faq-section";
import { FeaturesSection } from "@/components/landing/sections/features-section";
import { HeroSection } from "@/components/landing/sections/hero-section";
import { InvariantSection } from "@/components/landing/sections/invariant-section";
import { ProofSection } from "@/components/landing/sections/proof-section";
import { SiteNav } from "@/components/landing/sections/site-nav";
import { TimelineSection } from "@/components/landing/sections/timeline-section";
import { useLandingMotion } from "@/components/landing/use-landing-motion";
import { useDocumentTitle } from "@/lib/use-document-title";
import "@/styles/landing.css";

const HelixCanvas = lazy(async () => {
  const module = await import("@/components/landing/helix/helix-canvas");
  return { default: module.HelixCanvas };
});

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingMotion(rootRef);
  useDocumentTitle(null);

  return (
    <div className="landing" ref={rootRef}>
      <div className="bg-sheen" aria-hidden />
      <Suspense fallback={null}>
        <HelixCanvas />
      </Suspense>
      <SiteNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ConsoleSection />
        <ChainSection />
        <InvariantSection />
        <TimelineSection />
        <ProofSection />
        <FailuresSection />
        <FaqSection />
        <ClosingSection />
      </main>
    </div>
  );
}
